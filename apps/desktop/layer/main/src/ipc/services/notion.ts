import { net, safeStorage } from "electron"
import { IpcMethod, IpcService } from "electron-ipc-decorator"

import { NotionClient } from "~/lib/notion/client"
import type { NotionArticle } from "~/lib/notion/content"
import type { NotionMapping } from "~/lib/notion/mapping"
import { mappingTypes, validateMapping } from "~/lib/notion/mapping"
import { store } from "~/lib/store"

export interface LocalNotionConnection {
  token: string
  dataSourceId: string
  mapping?: NotionMapping
}

function validateLocalConnection(value: LocalNotionConnection) {
  if (
    !value ||
    typeof value !== "object" ||
    typeof value.token !== "string" ||
    !value.token.trim() ||
    value.token.length > 1000 ||
    typeof value.dataSourceId !== "string" ||
    !value.dataSourceId ||
    value.dataSourceId.length > 1000 ||
    (value.mapping !== undefined &&
      (!value.mapping ||
        typeof value.mapping !== "object" ||
        Object.entries(value.mapping).some(
          ([key, id]) =>
            !Object.hasOwn(mappingTypes, key) || typeof id !== "string" || !id || id.length > 1000,
        )))
  )
    throw new Error("Invalid local connection")
}

export class NotionService extends IpcService {
  static override readonly groupName = "notion"
  private local?: LocalNotionConnection
  private selection?: {
    token: string
    expires: number
    ids: Set<string>
    generation: number
  }
  private expiryTimer?: ReturnType<typeof setTimeout>
  private generation = 0
  private readonly pending = new Set<string>()

  private connection(): LocalNotionConnection | undefined {
    if (this.local) return this.local
    const legacy = store.get("notionConnection")
    if (!legacy) return undefined
    try {
      return {
        token: safeStorage.decryptString(Buffer.from(legacy.encryptedToken, "base64")),
        dataSourceId: legacy.dataSourceId,
        mapping: legacy.mapping,
      }
    } catch {
      throw new Error("NOTION_LEGACY_RECONNECT")
    }
  }

  @IpcMethod()
  async hydrateLocalConnection(connection: LocalNotionConnection | null) {
    if (connection !== null) validateLocalConnection(connection)
    if (JSON.stringify(this.local || null) === JSON.stringify(connection)) return
    this.local = connection ? structuredClone(connection) : undefined
    await this.cancelSelection()
  }

  // Only called after the renderer has durably saved the local connection.
  @IpcMethod()
  async finalizeLocalConnection() {
    if (!this.local) throw new Error("Connect Notion first")
    store.delete("notionConnection")
  }

  @IpcMethod()
  async getStatus() {
    const connection = this.local || store.get("notionConnection")
    return {
      configured: Boolean(connection),
      dataSourceId: connection?.dataSourceId || "",
      legacy: !this.local && !!connection,
    }
  }

  @IpcMethod()
  async beginSelection(token?: string) {
    if (token !== undefined && (typeof token !== "string" || !token.trim() || token.length > 1000))
      throw new Error("Invalid integration token")
    if (!token && !this.connection()) throw new Error("Connect Notion first")
    const generation = ++this.generation
    this.selection = undefined
    if (this.expiryTimer) clearTimeout(this.expiryTimer)
    const value = token?.trim() || this.connection()!.token
    const result = await new NotionClient(value, net.fetch).searchSources()
    if (generation !== this.generation) throw new Error("Selection cancelled")
    this.selection = {
      token: value,
      expires: Date.now() + 600_000,
      ids: new Set(result.items.map((item) => item.id)),
      generation,
    }
    if (this.expiryTimer) clearTimeout(this.expiryTimer)
    this.expiryTimer = setTimeout(() => {
      if (this.selection?.generation === generation) this.selection = undefined
    }, 600_000)
    this.expiryTimer.unref()
    return result
  }

  private requireSelection() {
    if (
      !this.selection ||
      this.selection.expires < Date.now() ||
      this.selection.generation !== this.generation
    ) {
      this.selection = undefined
      throw new Error("Selection expired. Connect again.")
    }
    return this.selection
  }

  @IpcMethod()
  async searchSources(query: string, cursor?: string) {
    if (
      typeof query !== "string" ||
      query.length > 200 ||
      (cursor !== undefined && (typeof cursor !== "string" || cursor.length > 1000))
    )
      throw new Error("Invalid search")
    const selection = this.requireSelection()
    const token = selection.token
    const result = await new NotionClient(token, net.fetch).searchSources(query, cursor)
    if (this.requireSelection() !== selection) throw new Error("Selection changed")
    for (const item of result.items) selection.ids.add(item.id)
    return result
  }

  @IpcMethod()
  async selectSource(id: string) {
    const selection = this.requireSelection()
    if (!selection.ids.has(id)) throw new Error("Select a listed data source")
    const token = selection.token
    await new NotionClient(token, net.fetch).titleProperty(id)
    if (this.requireSelection() !== selection) throw new Error("Selection changed")
    const previous = this.local || store.get("notionConnection")
    this.local = {
      token: selection.token,
      dataSourceId: id,
      ...(previous?.dataSourceId === id ? { mapping: previous.mapping } : {}),
    }
    this.selection = undefined
    if (this.expiryTimer) clearTimeout(this.expiryTimer)
    this.generation++
    return structuredClone(this.local)
  }

  @IpcMethod()
  async cancelSelection() {
    if (this.expiryTimer) clearTimeout(this.expiryTimer)
    this.selection = undefined
    this.generation++
  }

  @IpcMethod()
  async getMapping() {
    const connection = this.connection()
    if (!connection) throw new Error("Connect Notion first")
    const generation = this.generation
    const token = connection.token
    const properties = await new NotionClient(token, net.fetch).properties(connection.dataSourceId)
    if (generation !== this.generation) throw new Error("Connection changed")
    return { properties, mapping: connection.mapping || {} }
  }

  @IpcMethod()
  async setMapping(mapping: NotionMapping) {
    const generation = this.generation
    const { properties } = await this.getMapping()
    validateMapping(properties, mapping)
    const connection = this.connection()
    if (!connection || generation !== this.generation) throw new Error("Connection changed")
    if (!this.local) {
      const legacy = store.get("notionConnection")!
      store.set("notionConnection", { ...legacy, mapping })
      return null
    }
    this.local = { ...connection, mapping }
    return structuredClone(this.local)
  }

  @IpcMethod()
  async disconnect(): Promise<void> {
    if (this.expiryTimer) clearTimeout(this.expiryTimer)
    this.generation++
    this.selection = undefined
    this.local = undefined
    store.delete("notionConnection")
  }

  @IpcMethod()
  async saveArticle(article: NotionArticle): Promise<{ url: string; warnings: string[] }> {
    if (
      typeof article?.title !== "string" ||
      typeof article?.url !== "string" ||
      typeof article?.content !== "string" ||
      (["feedTitle", "author", "publishedAt", "description", "aiSummary"] as const).some(
        (key) =>
          article[key] !== undefined &&
          (typeof article[key] !== "string" || article[key]!.length > 200_000),
      ) ||
      (article.categories !== undefined &&
        (!Array.isArray(article.categories) ||
          article.categories.length > 100 ||
          article.categories.some((value) => typeof value !== "string" || value.length > 2000))) ||
      (article.publishedAt !== undefined &&
        (!/^\d{4}-\d\d-\d\dT/.test(article.publishedAt) ||
          !Number.isFinite(Date.parse(article.publishedAt))))
    ) {
      throw new Error("Invalid article data.")
    }
    let url: URL
    try {
      url = new URL(article.url)
    } catch {
      throw new Error("The article has no valid URL.")
    }
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password)
      throw new Error("The article has no valid URL.")
    const connection = this.connection()
    if (!connection) throw new Error("Connect Notion in Settings → Integrations first.")
    if (this.pending.has(article.url))
      throw new Error("This article is already being saved to Notion.")
    this.pending.add(article.url)
    try {
      let token: string
      try {
        token = connection.token
      } catch {
        throw new Error(
          "Notion credentials could not be unlocked. Reconnect Notion in Settings → Integrations.",
        )
      }
      return await new NotionClient(token, net.fetch).save(
        connection.dataSourceId,
        article,
        connection.mapping,
      )
    } finally {
      this.pending.delete(article.url)
    }
  }
}

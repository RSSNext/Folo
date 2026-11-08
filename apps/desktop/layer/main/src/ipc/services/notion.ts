import { net, safeStorage } from "electron"
import { IpcMethod, IpcService } from "electron-ipc-decorator"

import { NotionClient } from "~/lib/notion/client"
import type { NotionArticle } from "~/lib/notion/content"
import { store } from "~/lib/store"

function requireSecureStorage() {
  if (
    !safeStorage.isEncryptionAvailable() ||
    (process.platform === "linux" && safeStorage.getSelectedStorageBackend() === "basic_text")
  ) {
    throw new Error(
      "OS secure storage is unavailable. Unlock your system key store before connecting Notion.",
    )
  }
}

export class NotionService extends IpcService {
  static override readonly groupName = "notion"
  private generation = 0
  private readonly pending = new Set<string>()

  @IpcMethod()
  async getStatus(): Promise<{ configured: boolean; dataSourceId: string }> {
    const connection = store.get("notionConnection")
    return { configured: Boolean(connection), dataSourceId: connection?.dataSourceId || "" }
  }

  @IpcMethod()
  async configure(input: { token: string; dataSourceId: string }): Promise<void> {
    requireSecureStorage()
    if (
      typeof input?.token !== "string" ||
      !input.token.trim() ||
      input.token.length > 1000 ||
      typeof input?.dataSourceId !== "string" ||
      !/^[\da-f]{8}-?[\da-f]{4}-?[\da-f]{4}-?[\da-f]{4}-?[\da-f]{12}$/i.test(
        input.dataSourceId.trim(),
      )
    ) {
      throw new Error("Enter a Notion internal integration token and a valid data source ID.")
    }
    const generation = ++this.generation
    const token = input.token.trim()
    const dataSourceId = input.dataSourceId.trim()
    await new NotionClient(token, net.fetch).titleProperty(dataSourceId)
    if (generation !== this.generation) throw new Error("Notion connection was cancelled.")
    store.set("notionConnection", {
      encryptedToken: safeStorage.encryptString(token).toString("base64"),
      dataSourceId,
    })
  }

  @IpcMethod()
  async disconnect(): Promise<void> {
    this.generation++
    store.delete("notionConnection")
  }

  @IpcMethod()
  async saveArticle(article: NotionArticle): Promise<{ url: string; warnings: string[] }> {
    requireSecureStorage()
    if (
      typeof article?.title !== "string" ||
      typeof article?.url !== "string" ||
      typeof article?.content !== "string" ||
      (article.feedTitle !== undefined && typeof article.feedTitle !== "string")
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
    const connection = store.get("notionConnection")
    if (!connection) throw new Error("Connect Notion in Settings → Integrations first.")
    if (this.pending.has(article.url))
      throw new Error("This article is already being saved to Notion.")
    this.pending.add(article.url)
    try {
      let token: string
      try {
        token = safeStorage.decryptString(Buffer.from(connection.encryptedToken, "base64"))
      } catch {
        throw new Error(
          "Notion credentials could not be unlocked. Reconnect Notion in Settings → Integrations.",
        )
      }
      return await new NotionClient(token, net.fetch).save(connection.dataSourceId, article)
    } finally {
      this.pending.delete(article.url)
    }
  }
}

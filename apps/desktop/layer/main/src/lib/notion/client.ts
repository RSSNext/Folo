import { setTimeout } from "node:timers/promises"

import type { NotionArticle } from "./content"
import { articleBlocks } from "./content"
import type { NotionMapping, NotionProperty } from "./mapping"
import { mappedProperties } from "./mapping"

interface DataSource {
  properties: Record<string, { type: string; id?: string }>
}
interface FileUpload {
  id: string
  status: string
}

export class NotionClient {
  constructor(
    private readonly token: string,
    private readonly requestFetch: (url: string, init?: RequestInit) => Promise<Response> = fetch,
  ) {}

  private async request<T>(path: string, method = "GET", body?: unknown): Promise<T> {
    let response: Response
    try {
      response = await this.requestFetch(`https://api.notion.com/v1/${path}`, {
        method,
        redirect: "error",
        signal: AbortSignal.timeout(30_000),
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Notion-Version": "2025-09-03",
          "Content-Type": "application/json",
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      })
    } catch {
      // Never retry a write automatically: a lost response can still mean it succeeded.
      throw new Error(
        "Notion could not be reached. Check Notion before saving again; the request may have succeeded.",
      )
    }
    if (!response.ok)
      throw new Error(
        `Notion request failed (${response.status}). Check connection permissions and data source access.`,
      )
    try {
      return (await response.json()) as T
    } catch {
      throw new Error("Notion returned an invalid response.")
    }
  }

  async searchSources(query = "", cursor?: string) {
    const result = await this.request<{
      results: Array<{
        object: string
        id: string
        title?: Array<{ plain_text?: string; text?: { content: string } }>
        parent?: { database_id?: string }
      }>
      has_more: boolean
      next_cursor: string | null
    }>("search", "POST", {
      filter: { property: "object", value: "data_source" },
      page_size: 50,
      ...(query ? { query } : {}),
      ...(cursor ? { start_cursor: cursor } : {}),
    })
    return {
      items: result.results
        .filter((item) => item.object === "data_source")
        .map((item) => ({
          id: item.id,
          title:
            item.title?.map((t) => t.plain_text || t.text?.content || "").join("") || "Untitled",
          databaseId: item.parent?.database_id || "",
        })),
      nextCursor: result.has_more ? result.next_cursor : null,
    }
  }

  async properties(dataSourceId: string): Promise<NotionProperty[]> {
    const source = await this.request<DataSource>(
      `data_sources/${encodeURIComponent(dataSourceId)}`,
    )
    return Object.entries(source.properties || {}).map(([name, p]) => ({
      id: p.id || name,
      name,
      type: p.type,
    }))
  }

  async titleProperty(dataSourceId: string): Promise<string> {
    const source = await this.request<DataSource>(
      `data_sources/${encodeURIComponent(dataSourceId)}`,
    )
    const title = Object.entries(source.properties || {}).find(
      ([, property]) => property.type === "title",
    )?.[0]
    if (!title) throw new Error("Notion data source has no title property.")
    return title
  }

  async save(
    dataSourceId: string,
    article: NotionArticle,
    mapping: NotionMapping = {},
  ): Promise<{ url: string; warnings: string[] }> {
    if (!article.content.trim()) throw new Error("No article content is available to save.")
    if (article.content.length > 1_000_000)
      throw new Error("This article is too large to save to Notion.")
    const properties = mappedProperties(await this.properties(dataSourceId), mapping, article)
    const blocks = articleBlocks(article)
    if (blocks.length > 2000)
      throw new Error("This article contains too many blocks to save to Notion.")
    if (
      Buffer.byteLength(
        JSON.stringify({
          parent: { type: "data_source_id", data_source_id: dataSourceId },
          properties,
          children: blocks,
        }),
      ) > 450_000
    )
      throw new Error("This article exceeds Notion’s request size limit.")
    const warnings: string[] = []
    if (mapping.aiSummary && !article.aiSummary?.trim()) warnings.push("NOTION_AI_SUMMARY_MISSING")
    const imageDeadline = Date.now() + 5 * 60_000
    const uploads = new Map<string, string>()
    for (const block of blocks) {
      if (block.type !== "image" || block.image.type !== "external") continue
      const imageURL = block.image.external.url
      try {
        if (Date.now() > imageDeadline) throw new Error("Image import time limit exceeded")
        let id = uploads.get(imageURL)
        if (!id) {
          await setTimeout(350)
          const filename =
            new URL(imageURL).pathname
              .split("/")
              .pop()
              ?.replace(/[^\w.-]/g, "_")
              .slice(-100) || "image.jpg"
          let upload = await this.request<FileUpload>("file_uploads", "POST", {
            mode: "external_url",
            external_url: imageURL,
            filename,
          })
          for (
            let attempt = 0;
            upload.status === "pending" && attempt < 10 && Date.now() < imageDeadline;
            attempt++
          ) {
            await setTimeout(1000)
            upload = await this.request<FileUpload>(`file_uploads/${encodeURIComponent(upload.id)}`)
          }
          if (upload.status !== "uploaded" || !upload.id) throw new Error("Image import failed")
          id = upload.id
          uploads.set(imageURL, id)
        }
        block.image = { type: "file_upload", file_upload: { id } }
      } catch {
        // Keep the source URL visible rather than silently discarding failed images.
        warnings.push(
          "An image could not be archived. Its original URL was retained and may expire.",
        )
      }
    }
    const page = await this.request<{ id: string; url: string }>("pages", "POST", {
      parent: { type: "data_source_id", data_source_id: dataSourceId },
      properties,
      children: blocks.slice(0, 100),
    })
    if (!page.id || !page.url)
      throw new Error("Notion returned no page URL. Check Notion before saving again.")
    for (let offset = 100; offset < blocks.length; offset += 100) {
      try {
        await setTimeout(350)
        await this.request(`blocks/${encodeURIComponent(page.id)}/children`, "PATCH", {
          children: blocks.slice(offset, offset + 100),
        })
      } catch {
        warnings.push(
          "The page was created, but some article content could not be saved. Open the page to review it before saving again.",
        )
        break
      }
    }
    return { url: page.url, warnings: [...new Set(warnings)] }
  }
}

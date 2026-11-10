import { createServer } from "node:http"
import type { AddressInfo } from "node:net"

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"

import { NotionClient } from "./client"

// Exercise the real fetch/HTTP boundary without contacting Notion or needing credentials.
const requests: Array<{
  path: string
  method: string
  authorization: string
  version: string
  body: Record<string, unknown>
}> = []
let rejectAccess = false
let importPolls = 0
let origin = ""
const server = createServer(async (request, response) => {
  const chunks: Buffer[] = []
  for await (const chunk of request) chunks.push(Buffer.from(chunk))
  const body = Buffer.concat(chunks).toString()
  requests.push({
    path: request.url || "",
    method: request.method || "",
    authorization: request.headers.authorization || "",
    version: String(request.headers["notion-version"] || ""),
    body: body ? JSON.parse(body) : {},
  })
  response.setHeader("content-type", "application/json")
  if (rejectAccess) {
    response
      .writeHead(403)
      .end(JSON.stringify({ message: "Provider debug data must not be shown" }))
    return
  }
  if (request.url?.startsWith("/v1/data_sources/")) {
    response.end(JSON.stringify({ properties: { "Article title": { type: "title" } } }))
  } else if (request.url === "/v1/file_uploads" && request.method === "POST") {
    response.end(JSON.stringify({ id: "synthetic-upload", status: "pending" }))
  } else if (request.url === "/v1/file_uploads/synthetic-upload") {
    importPolls++
    response.end(JSON.stringify({ id: "synthetic-upload", status: "uploaded" }))
  } else if (request.url === "/v1/pages" && request.method === "POST") {
    response.end(
      JSON.stringify({ id: "synthetic-page", url: "https://www.notion.so/synthetic-page" }),
    )
  } else if (request.url === "/v1/blocks/synthetic-page/children" && request.method === "PATCH") {
    response.end(JSON.stringify({ results: [] }))
  } else {
    response.writeHead(404).end(JSON.stringify({ message: "Unexpected endpoint" }))
  }
})

beforeAll(async () => {
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve))
  origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
})
afterAll(async () => {
  server.closeAllConnections()
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  )
})
beforeEach(() => {
  requests.length = 0
  rejectAccess = false
  importPolls = 0
})

function localClient() {
  return new NotionClient("synthetic-test-token-not-a-credential", (url, init) => {
    const target = new URL(url)
    if (target.origin !== "https://api.notion.com") throw new Error("Unexpected remote destination")
    return fetch(`${origin}${target.pathname}`, init)
  })
}

describe("Notion export HTTP contract", () => {
  it("validates the target, imports an image, creates a page and appends remaining blocks", async () => {
    const result = await localClient().save("synthetic-data-source", {
      title: "Synthetic article",
      url: "https://example.com/article",
      feedTitle: "Synthetic feed",
      content: `<h2>Heading</h2><p>See <a href="/detail">detail</a></p><img src="https://example.com/image.jpg">${"<p>Body paragraph</p>".repeat(105)}`,
    })
    expect(result).toEqual({ url: "https://www.notion.so/synthetic-page", warnings: [] })
    expect(importPolls).toBe(1)
    expect(requests.map((request) => [request.method, request.path])).toEqual([
      ["GET", "/v1/data_sources/synthetic-data-source"],
      ["POST", "/v1/file_uploads"],
      ["GET", "/v1/file_uploads/synthetic-upload"],
      ["POST", "/v1/pages"],
      ["PATCH", "/v1/blocks/synthetic-page/children"],
    ])
    expect(
      requests.every(
        (request) =>
          request.authorization === "Bearer synthetic-test-token-not-a-credential" &&
          request.version === "2025-09-03",
      ),
    ).toBe(true)
    const page = requests.find((request) => request.path === "/v1/pages")?.body
    expect(page?.parent).toEqual({
      type: "data_source_id",
      data_source_id: "synthetic-data-source",
    })
    expect(page?.properties).toEqual({
      "Article title": { title: [{ type: "text", text: { content: "Synthetic article" } }] },
    })
    expect(page?.children).toHaveLength(100)
    expect(JSON.stringify(page)).toContain('"file_upload":{"id":"synthetic-upload"}')
    expect(JSON.stringify(page)).toContain("https://example.com/detail")
    expect(JSON.stringify(page)).toContain("Synthetic feed")
    expect(requests.at(-1)?.body.children).toHaveLength(9)
  })
  it("stops before writes on permission denial and does not expose provider debug text", async () => {
    rejectAccess = true
    await expect(
      localClient().save("synthetic-data-source", {
        title: "Synthetic",
        url: "https://example.com",
        content: "<p>Text</p>",
      }),
    ).rejects.toThrow("Notion request failed (403)")
    expect(requests).toHaveLength(1)
    expect(requests[0]?.method).toBe("GET")
  })
})

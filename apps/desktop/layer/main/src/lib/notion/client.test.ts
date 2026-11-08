import { describe, expect, it } from "vitest"

import { NotionClient } from "./client"

const article = {
  title: "A title",
  url: "https://example.com/article",
  feedTitle: "Feed",
  content: "<p>Body</p>",
}

describe("NotionClient", () => {
  it("discovers the title property and creates a page in the selected data source", async () => {
    const requests: Array<{ url: string; body: unknown }> = []
    const client = new NotionClient("secret", async (url, init) => {
      requests.push({ url: String(url), body: init?.body ? JSON.parse(String(init.body)) : null })
      return Response.json(
        String(url).includes("data_sources")
          ? { properties: { Name: { type: "title" } } }
          : { id: "page-id", url: "https://notion.so/page-id" },
      )
    })
    expect(await client.save("source-id", article)).toEqual({
      url: "https://notion.so/page-id",
      warnings: [],
    })
    expect(requests[1]?.body).toMatchObject({
      parent: { type: "data_source_id", data_source_id: "source-id" },
      properties: { Name: { title: [{ text: { content: "A title" } }] } },
    })
    expect(JSON.stringify(requests)).toContain("Body")
  })
  it("does not retry writes after an uncertain network failure", async () => {
    let writes = 0
    const client = new NotionClient("secret", async (_url, init) => {
      if (init?.method === "POST") {
        writes++
        throw new Error("network secret")
      }
      return Response.json({ properties: { Name: { type: "title" } } })
    })
    await expect(client.save("source-id", article)).rejects.toThrow("Notion")
    expect(writes).toBe(1)
  })
  it("does not leak credentials or remote errors", async () => {
    const client = new NotionClient("top-secret", async () =>
      Response.json({ message: "top-secret" }, { status: 401 }),
    )
    await expect(client.save("source-id", article)).rejects.toThrow("Notion request failed (401)")
  })
  it("imports external images and uses persistent upload IDs", async () => {
    const bodies: unknown[] = []
    const client = new NotionClient("secret", async (url, init) => {
      if (init?.body) bodies.push(JSON.parse(String(init.body)))
      if (String(url).includes("data_sources"))
        return Response.json({ properties: { Name: { type: "title" } } })
      if (String(url).includes("file_uploads"))
        return Response.json({ id: "upload-id", status: "uploaded" })
      return Response.json({ id: "page-id", url: "https://notion.so/page-id" })
    })
    await client.save("source-id", {
      ...article,
      content: '<img src="https://example.com/photo.jpg">',
    })
    expect(bodies).toContainEqual({
      mode: "external_url",
      external_url: "https://example.com/photo.jpg",
      filename: "photo.jpg",
    })
    expect(JSON.stringify(bodies)).toContain('"file_upload":{"id":"upload-id"}')
  })
})

describe("partial exports", () => {
  it("returns the created page with a warning when later blocks fail", async () => {
    const client = new NotionClient("secret", async (url, init) => {
      if (String(url).includes("data_sources"))
        return Response.json({ properties: { Name: { type: "title" } } })
      if (init?.method === "PATCH") return Response.json({}, { status: 429 })
      return Response.json({ id: "page-id", url: "https://notion.so/page-id" })
    })
    const result = await client.save("source-id", {
      ...article,
      content: "<p>A paragraph</p>".repeat(110),
    })
    expect(result.url).toBe("https://notion.so/page-id")
    expect(result.warnings.join()).toContain("some article content could not be saved")
  })
  it("retains external image URLs with an explicit warning if import fails", async () => {
    let pageBody = ""
    const client = new NotionClient("secret", async (url, init) => {
      if (String(url).includes("data_sources"))
        return Response.json({ properties: { Name: { type: "title" } } })
      if (String(url).includes("file_uploads")) return Response.json({}, { status: 400 })
      pageBody = String(init?.body)
      return Response.json({ id: "page-id", url: "https://notion.so/page-id" })
    })
    const result = await client.save("source-id", {
      ...article,
      content: '<img src="https://example.com/image.jpg">',
    })
    expect(result.warnings.join()).toContain("could not be archived")
    expect(pageBody).toContain('"external":{"url":"https://example.com/image.jpg"}')
  })
})

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

it("writes selected property IDs and refuses stale mappings before any write", async () => {
  const bodies: unknown[] = []
  const client = new NotionClient("synthetic", async (_url, init) => {
    if (init?.method === "POST") {
      bodies.push(JSON.parse(String(init.body)))
      return Response.json({ id: "page", url: "https://notion.so/page" })
    }
    return Response.json({
      properties: {
        RenamedTitle: { id: "t", type: "title" },
        RenamedURL: { id: "u", type: "url" },
      },
    })
  })
  await client.save("source", article, { url: "u" })
  expect(bodies[0]).toMatchObject({
    properties: { u: { url: article.url }, t: { title: [{ text: { content: article.title } }] } },
  })
  await expect(client.save("source", article, { url: "missing" })).rejects.toThrow()
  expect(bodies).toHaveLength(1)
})

it("searches data sources with pagination and preserves their parent database", async () => {
  const client = new NotionClient("synthetic", async (_url, init) => {
    expect(JSON.parse(String(init?.body))).toMatchObject({
      filter: { property: "object", value: "data_source" },
      query: "Notes",
      start_cursor: "next",
    })
    return Response.json({
      results: [
        {
          object: "data_source",
          id: "source",
          title: [{ plain_text: "Notes" }],
          parent: { database_id: "db" },
        },
      ],
      has_more: true,
      next_cursor: "more",
    })
  })
  expect(await client.searchSources("Notes", "next")).toEqual({
    items: [{ id: "source", title: "Notes", databaseId: "db" }],
    nextCursor: "more",
  })
})

it("warns when mapped AI summary is absent without requesting generation", async () => {
  const requests: string[] = []
  const client = new NotionClient("synthetic", async (url, init) => {
    requests.push(url)
    return Response.json(
      init?.method === "POST"
        ? { id: "page", url: "https://notion.so/page" }
        : { properties: { Title: { id: "t", type: "title" }, AI: { id: "a", type: "rich_text" } } },
    )
  })
  const result = await client.save("source", article, { aiSummary: "a" })
  expect(result.warnings).toContain("NOTION_AI_SUMMARY_MISSING")
  expect(requests).toEqual([
    "https://api.notion.com/v1/data_sources/source",
    "https://api.notion.com/v1/pages",
  ])
})

it("rejects combined UTF8 property payload before any remote writes", async () => {
  let writes = 0
  const client = new NotionClient("synthetic", async (_url, init) => {
    if (init?.method === "POST") writes++
    return Response.json({
      properties: { Title: { id: "t", type: "title" }, AI: { id: "a", type: "rich_text" } },
    })
  })
  await expect(
    client.save("source", { ...article, aiSummary: "中".repeat(160000) }, { aiSummary: "a" }),
  ).rejects.toThrow("request size")
  expect(writes).toBe(0)
})

it("writes publication offsets as the same instant and omits absent dates", async () => {
  const bodies: Array<{ properties: Record<string, unknown> }> = []
  const client = new NotionClient("synthetic", async (_url, init) => {
    if (init?.method === "POST") {
      bodies.push(JSON.parse(String(init.body)))
      return Response.json({ id: "page", url: "https://notion.so/page" })
    }
    return Response.json({
      properties: {
        Name: { id: "title", type: "title" },
        Published: { id: "published", type: "date" },
        Created: { id: "created", type: "created_time" },
      },
    })
  })
  await client.save(
    "source",
    { ...article, publishedAt: "2026-11-08T08:30:00+08:00" },
    { publishedAt: "published" },
  )
  expect(bodies[0]?.properties.published).toEqual({ date: { start: "2026-11-08T00:30:00.000Z" } })
  await client.save("source", article, { publishedAt: "published" })
  expect(bodies[1]?.properties).not.toHaveProperty("published")
  await expect(client.save("source", article, { publishedAt: "created" })).rejects.toThrow()
  await expect(
    client.save("source", { ...article, publishedAt: "invalid" }, { publishedAt: "published" }),
  ).rejects.toThrow()
  expect(bodies).toHaveLength(2)
})

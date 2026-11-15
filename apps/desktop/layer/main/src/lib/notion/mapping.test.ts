import { expect, it } from "vitest"

import { mappedProperties } from "./mapping"
it("maps compatible properties and preserves title", () => {
  expect(
    mappedProperties(
      [
        { id: "t", name: "Name", type: "title" },
        { id: "u", name: "URL", type: "url" },
        { id: "s", name: "Source", type: "rich_text" },
      ],
      { url: "u", feedTitle: "s" },
      { title: "Article", url: "https://example.com", feedTitle: "Feed", content: "body" },
    ),
  ).toMatchObject({
    u: { url: "https://example.com" },
    s: { rich_text: [{ text: { content: "Feed" } }] },
  })
})
it("rejects stale or incompatible mappings before writing", () => {
  expect(() =>
    mappedProperties(
      [{ id: "t", name: "Name", type: "title" }],
      { url: "gone" },
      { title: "A", url: "https://example.com", content: "body" },
    ),
  ).toThrow()
})

it("maps metadata and dates while skipping absent summaries", () => {
  const fields = [
    { id: "t", name: "Title", type: "title" },
    { id: "a", name: "Author", type: "rich_text" },
    { id: "d", name: "Date", type: "date" },
    { id: "s", name: "AI", type: "rich_text" },
  ]
  expect(
    mappedProperties(
      fields,
      { author: "a", publishedAt: "d", aiSummary: "s" },
      {
        title: "A",
        url: "https://example.com",
        content: "body",
        author: "Writer",
        publishedAt: "2026-11-08T00:00:00.000Z",
      },
    ),
  ).toMatchObject({
    a: { rich_text: [{ text: { content: "Writer" } }] },
    d: { date: { start: "2026-11-08T00:00:00.000Z" } },
  })
  expect(() =>
    mappedProperties(
      fields,
      { author: "a", description: "a" },
      { title: "A", url: "https://example.com", content: "body" },
    ),
  ).toThrow()
})

it("rejects invalid dates and overlong summaries without truncation", () => {
  const fields = [
    { id: "t", name: "Title", type: "title" },
    { id: "d", name: "Date", type: "date" },
    { id: "a", name: "AI", type: "rich_text" },
  ]
  const base = { title: "A", url: "https://example.com", content: "body" }
  expect(() =>
    mappedProperties(fields, { publishedAt: "d" }, { ...base, publishedAt: "invalid" }),
  ).toThrow()
  expect(() =>
    mappedProperties(fields, { aiSummary: "a" }, { ...base, aiSummary: "a".repeat(200001) }),
  ).toThrow()
  expect(
    mappedProperties(fields, { aiSummary: "a" }, { ...base, aiSummary: "a".repeat(2000) }),
  ).toMatchObject({ a: { rich_text: [{ text: { content: "a".repeat(2000) } }] } })
})
it("extracts plain description text and joins categories", () => {
  const fields = [
    { id: "t", name: "Title", type: "title" },
    { id: "d", name: "Description", type: "rich_text" },
    { id: "c", name: "Categories", type: "rich_text" },
  ]
  expect(
    mappedProperties(
      fields,
      { description: "d", categories: "c" },
      {
        title: "A",
        url: "https://example.com",
        content: "body",
        description: "<p>Hello &amp; world</p>",
        categories: ["AI", "Product"],
      },
    ),
  ).toMatchObject({
    d: { rich_text: [{ text: { content: "Hello & world" } }] },
    c: { rich_text: [{ text: { content: "AI, Product" } }] },
  })
})

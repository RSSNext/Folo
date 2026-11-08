import { describe, expect, it } from "vitest"

import { articleBlocks } from "./content"

describe("articleBlocks", () => {
  it("preserves heading, paragraphs and source without executable markup", () => {
    const result = articleBlocks({
      title: "Article",
      url: "https://example.com/story",
      feedTitle: "Feed",
      content: "<h2>Heading</h2><p>Hello <strong>world</strong></p><script>secret()</script>",
    })
    expect(JSON.stringify(result)).toContain("Heading")
    expect(JSON.stringify(result)).toContain("Hello world")
    expect(JSON.stringify(result)).toContain("Feed")
    expect(JSON.stringify(result)).not.toContain("secret()")
    expect(result.some((block) => block.type === "heading_2")).toBe(true)
  })
  it("resolves relative images but rejects non-public or unsafe image URLs", () => {
    const result = articleBlocks({
      title: "Article",
      url: "https://example.com/story",
      content:
        '<img src="/photo.jpg"><img src="http://localhost/secret"><img src="data:image/png;base64,x"><img src="https://127.0.0.1/a">',
    })
    expect(result.filter((block) => block.type === "image")).toEqual([
      {
        object: "block",
        type: "image",
        image: { type: "external", external: { url: "https://example.com/photo.jpg" } },
      },
    ])
  })
  it("chunks long text at Notion limits without splitting Unicode characters", () => {
    const blocks = articleBlocks({
      title: "Article",
      url: "https://example.com",
      content: `<p>${"🦊".repeat(2001)}</p>`,
    })
    const paragraph = blocks.find(
      (block) => block.type === "paragraph" && JSON.stringify(block).includes("🦊"),
    )
    expect(paragraph).toBeDefined()
    if (!paragraph || paragraph.type !== "paragraph") return
    expect(paragraph.paragraph.rich_text.map((part) => part.text.content).join("")).toBe(
      "🦊".repeat(2001),
    )
    expect(paragraph.paragraph.rich_text.every((part) => part.text.content.length <= 2000)).toBe(
      true,
    )
  })
})

describe("article source fidelity", () => {
  it("uses lazy image sources when src is a placeholder and omits empty images", () => {
    const blocks = articleBlocks({
      title: "A",
      url: "https://example.com/article",
      content: '<img src="data:image/gif;base64,a" data-src="https://example.com/image.jpg"><img>',
    })
    expect(blocks.filter((block) => block.type === "image")).toHaveLength(1)
    expect(JSON.stringify(blocks)).toContain("https://example.com/image.jpg")
  })
  it("retains link destinations and table cell boundaries", () => {
    const blocks = articleBlocks({
      title: "A",
      url: "https://example.com/article",
      content:
        '<p>See <a href="/details">details</a></p><table><tr><td>A</td><td>B</td></tr><tr><td>C</td><td>D</td></tr></table>',
    })
    expect(JSON.stringify(blocks)).toContain("https://example.com/details")
    expect(JSON.stringify(blocks)).toContain("A | B")
    expect(JSON.stringify(blocks)).toContain("C | D")
  })
})

it("preserves HTML line breaks inside paragraphs and inline formatting", () => {
  const blocks = articleBlocks({
    title: "A",
    url: "https://example.com/article",
    content: "<p>First<br>Second<br/><strong>Third</strong></p>",
  })
  const paragraph = blocks[1]
  expect(paragraph?.type).toBe("paragraph")
  if (paragraph?.type !== "paragraph") throw new Error("Expected paragraph")
  expect(paragraph.paragraph.rich_text.map((part) => part.text.content).join("")).toBe(
    "First\nSecond\nThird",
  )
})

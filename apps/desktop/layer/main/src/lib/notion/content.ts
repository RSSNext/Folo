import { isIP } from "node:net"

import { parseHTML } from "linkedom"

export interface NotionArticle {
  title: string
  url: string
  content: string
  author?: string
  publishedAt?: string
  description?: string
  aiSummary?: string
  categories?: string[]
  feedTitle?: string
}

export interface RichText {
  type: "text"
  text: { content: string }
}

type TextBlockType =
  | "paragraph"
  | "heading_1"
  | "heading_2"
  | "heading_3"
  | "bulleted_list_item"
  | "numbered_list_item"
  | "quote"
type TextBlock = {
  [K in TextBlockType]: { object: "block"; type: K } & Record<K, { rich_text: RichText[] }>
}[TextBlockType]
export type NotionBlock =
  | TextBlock
  | {
      object: "block"
      type: "image"
      image:
        | { type: "external"; external: { url: string } }
        | { type: "file_upload"; file_upload: { id: string } }
    }

export function richText(text: string): RichText[] {
  const parts: RichText[] = []
  let part = ""
  for (const character of text) {
    if (part.length + character.length > 2000) {
      parts.push({ type: "text", text: { content: part } })
      part = ""
    }
    part += character
  }
  if (part) parts.push({ type: "text", text: { content: part } })
  return parts
}

// Imports are performed by Notion, never by the reader's local network.
export function publicImageURL(value: string, base: string): string | undefined {
  try {
    if (!value.trim()) return undefined
    const url = new URL(value, base)
    const hostname = url.hostname.replace(/^\[|\]$/g, "")
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      isIP(hostname) ||
      !hostname.includes(".") ||
      /\.(?:localhost|local|internal|test|invalid)$/.test(hostname)
    )
      return undefined
    return url.href
  } catch {
    return undefined
  }
}

export function articleBlocks(article: NotionArticle): NotionBlock[] {
  const { document } = parseHTML(`<html><body>${article.content}</body></html>`)
  document
    .querySelectorAll("script,style,noscript,iframe,object,embed,svg,form")
    .forEach((node) => node.remove())
  document.querySelectorAll("br").forEach((node) => node.replaceWith("\n"))
  document.querySelectorAll("a[href]").forEach((node) => {
    try {
      const url = new URL(node.getAttribute("href") || "", article.url)
      if (["https:", "http:"].includes(url.protocol) && !url.username && !url.password)
        node.append(` (${url.href})`)
    } catch {
      /* Invalid links remain plain text. */
    }
  })
  document.querySelectorAll("table").forEach((table) => {
    const rows = [...table.querySelectorAll("tr")].map((row) =>
      [...row.querySelectorAll("th,td")].map((cell) => cell.textContent || "").join(" | "),
    )
    table.replaceWith(rows.join("\n"))
  })
  const blocks: NotionBlock[] = []
  const addText = (text: string, type: TextBlockType = "paragraph") => {
    const parts = richText(text.trim())
    // A rich-text array accepts at most 100 elements.
    for (let i = 0; i < parts.length; i += 100) {
      blocks.push({
        object: "block",
        type,
        [type]: { rich_text: parts.slice(i, i + 100) },
      } as TextBlock)
    }
  }
  addText([article.feedTitle, article.url].filter(Boolean).join("\n"))
  const walk = (node: Node) => {
    if (node.nodeType === 3) {
      addText(node.textContent || "")
      return
    }
    if (node.nodeType !== 1) return
    const element = node as Element
    if (element.tagName === "IMG") {
      const url =
        publicImageURL(element.getAttribute("src") || "", article.url) ||
        publicImageURL(element.getAttribute("data-src") || "", article.url)
      if (url)
        blocks.push({
          object: "block",
          type: "image",
          image: { type: "external", external: { url } },
        })
      return
    }
    const types: Record<string, TextBlockType> = {
      H1: "heading_1",
      H2: "heading_2",
      H3: "heading_3",
      H4: "heading_3",
      BLOCKQUOTE: "quote",
      LI: element.parentElement?.tagName === "OL" ? "numbered_list_item" : "bulleted_list_item",
    }
    if (!element.querySelector("p,div,h1,h2,h3,h4,li,blockquote,img,table,pre")) {
      addText(element.textContent || "", types[element.tagName] || "paragraph")
    } else {
      for (const child of element.childNodes) walk(child)
    }
  }
  for (const node of document.body.childNodes) walk(node)
  return blocks
}

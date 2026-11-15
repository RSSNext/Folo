import { parseHTML } from "linkedom"

import type { NotionArticle } from "./content"
import { richText } from "./content"
export interface NotionProperty {
  id: string
  name: string
  type: string
}
export const mappingTypes = {
  url: "url",
  feedTitle: "rich_text",
  author: "rich_text",
  publishedAt: "date",
  description: "rich_text",
  aiSummary: "rich_text",
  categories: "rich_text",
} as const
export type NotionMapping = Partial<Record<keyof typeof mappingTypes, string>>
export function validateMapping(properties: NotionProperty[], mapping: NotionMapping) {
  if (
    !mapping ||
    typeof mapping !== "object" ||
    Object.keys(mapping).some((key) => !Object.hasOwn(mappingTypes, key))
  )
    throw new Error("Invalid field mapping")
  const used = new Set<string>()
  for (const [key, type] of Object.entries(mappingTypes)) {
    const id = mapping[key as keyof NotionMapping]
    if (id === undefined) continue
    if (
      typeof id !== "string" ||
      used.has(id) ||
      !properties.some((p) => p.id === id && p.type === type)
    )
      throw new Error("Field mapping is no longer compatible. Update mapping in Settings.")
    used.add(id)
  }
}
export function mappedProperties(
  properties: NotionProperty[],
  mapping: NotionMapping,
  article: NotionArticle,
) {
  validateMapping(properties, mapping)
  const title = properties.find((p) => p.type === "title")
  if (!title) throw new Error("Notion data source has no title property.")
  const result: Record<string, unknown> = {
    [title.id]: { title: richText(article.title || article.url).slice(0, 100) },
  }
  for (const [key, id] of Object.entries(mapping)) {
    const field = key as keyof NotionMapping
    const raw = article[field]
    const value =
      field === "description" && typeof raw === "string"
        ? parseHTML(`<body>${raw}</body>`).document.querySelector("body")?.textContent || ""
        : Array.isArray(raw)
          ? raw.join(", ")
          : raw
    if (!id || !value?.trim()) continue
    if (field === "publishedAt") {
      if (!/^\d{4}-\d\d-\d\dT/.test(value) || !Number.isFinite(Date.parse(value)))
        throw new Error("Invalid publication date")
      result[id] = { date: { start: new Date(value).toISOString() } }
    } else if (field === "url") result[id] = { url: value }
    else {
      if (value.length > 200_000) throw new Error("Metadata exceeds Notion limits")
      const parts = richText(value)
      if (parts.length > 100) throw new Error("Metadata exceeds Notion limits")
      result[id] = { rich_text: parts }
    }
  }
  return result
}

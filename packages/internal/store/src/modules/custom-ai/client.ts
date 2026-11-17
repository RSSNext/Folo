import type { SupportedActionLanguage } from "@follow/shared"
import { ACTION_LANGUAGE_MAP } from "@follow/shared"

import type { TranslationField, TranslationMode } from "../translation/types"
import type { CustomAIConfig } from "./store"
import { getCustomAIConfig } from "./store"

type ChatMessage = { role: "system" | "user"; content: string }

/** About 6k tokens of article text, enough for a summary of most articles */
const MAX_SUMMARY_INPUT_CHARS = 24_000
/** Titles and descriptions translated in one request */
const SHORT_FIELD_BATCH_SIZE = 20

export class CustomAIError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message)
    this.name = "CustomAIError"
  }
}

const endpoint = (config: CustomAIConfig, path: string) =>
  `${config.baseURL.trim().replace(/\/+$/, "")}${path}`

const buildHeaders = (config: CustomAIConfig): Record<string, string> => {
  const apiKey = config.apiKey.trim()
  return {
    "content-type": "application/json",
    ...(apiKey ? { authorization: `Bearer ${apiKey}` } : {}),
  }
}

const readError = async (response: Response) => {
  const body = await response.text().catch(() => "")
  try {
    const json = JSON.parse(body) as { error?: { message?: string } | string; message?: string }
    const message =
      typeof json.error === "string" ? json.error : json.error?.message || json.message || body
    return `HTTP ${response.status}: ${message}`.slice(0, 500)
  } catch {
    return `HTTP ${response.status}: ${body}`.slice(0, 500)
  }
}

/** Reasoning models such as DeepSeek R1 may put their reasoning before the answer */
const stripThinking = (text: string) => text.replace(/^\s*<think>[\s\S]*?<\/think>/i, "")

const stripCodeFence = (text: string) => {
  const match = text.trim().match(/^```[\w-]*\n([\s\S]*?)\n?```$/)
  return match ? match[1]! : text
}

export const chatCompletion = async (
  messages: ChatMessage[],
  config: CustomAIConfig = getCustomAIConfig(),
) => {
  const response = await fetch(endpoint(config, "/chat/completions"), {
    method: "POST",
    headers: buildHeaders(config),
    body: JSON.stringify({ model: config.model.trim(), messages, stream: false }),
  })
  if (!response.ok) {
    throw new CustomAIError(await readError(response), response.status)
  }

  const json = (await response.json()) as {
    choices?: { message?: { content?: unknown } }[]
  }
  const content = json.choices?.[0]?.message?.content
  if (typeof content !== "string") {
    throw new CustomAIError("The API returned no message content")
  }
  return stripCodeFence(stripThinking(content)).trim()
}

/** The model IDs the API offers, for picking one in settings */
export const listCustomAIModels = async (config: CustomAIConfig) => {
  const response = await fetch(endpoint(config, "/models"), { headers: buildHeaders(config) })
  if (!response.ok) {
    throw new CustomAIError(await readError(response), response.status)
  }
  const json = (await response.json()) as { data?: { id?: unknown }[] }
  return (json.data ?? [])
    .map((model) => model.id)
    .filter((id): id is string => typeof id === "string")
    .sort((a, b) => a.localeCompare(b))
}

/** Sends a tiny request, so settings can tell whether the address, key and model work */
export const testCustomAIConfig = (config: CustomAIConfig) =>
  chatCompletion([{ role: "user", content: "Reply with the single word OK." }], config)

const languageName = (language: SupportedActionLanguage) =>
  ACTION_LANGUAGE_MAP[language]?.label ?? language

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
}

const decodeEntity = (match: string, code: string) => {
  if (code.startsWith("#")) {
    const isHex = code[1]?.toLowerCase() === "x"
    const codePoint = Number.parseInt(code.slice(isHex ? 2 : 1), isHex ? 16 : 10)
    return Number.isFinite(codePoint) && codePoint > 0 && codePoint <= 0x10ffff
      ? String.fromCodePoint(codePoint)
      : match
  }
  return NAMED_ENTITIES[code.toLowerCase()] ?? match
}

/** Article text without markup, so a summary request carries fewer tokens */
export const htmlToText = (html: string) =>
  html
    .replaceAll(/<(script|style|noscript|svg)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replaceAll(/<br\s*\/?>/gi, "\n")
    .replaceAll(/<\/(p|div|h[1-6]|li|blockquote|pre|tr|section|article|figcaption)>/gi, "\n")
    .replaceAll(/<[^>]+>/g, "")
    .replaceAll(/&(#x?[\da-f]+|[a-z]+);/gi, decodeEntity)
    .replaceAll(/[ \t\f\v]+/g, " ")
    .replaceAll(/\n[ \t]*/g, "\n")
    .replaceAll(/\n{3,}/g, "\n\n")
    .trim()

export const customAISummarize = async ({
  title,
  content,
  language,
}: {
  title?: string | null
  content: string
  language: SupportedActionLanguage
}) => {
  const text = htmlToText(content).slice(0, MAX_SUMMARY_INPUT_CHARS)
  if (!text) return null

  return chatCompletion([
    {
      role: "system",
      content: [
        "You summarize articles for an RSS reader.",
        `Write the summary in ${languageName(language)}, whatever the language of the article.`,
        "Be accurate and concise: one short paragraph, or a few bullet points for a long article.",
        'Do not add a title or a preamble, and do not start with phrases such as "This article".',
        "Return only the summary.",
      ].join(" "),
    },
    { role: "user", content: title ? `Title: ${title}\n\n${text}` : text },
  ])
}

const parseJsonObject = (text: string): Record<string, unknown> => {
  const start = text.indexOf("{")
  const end = text.lastIndexOf("}")
  if (start === -1 || end <= start) {
    throw new CustomAIError("The API did not return a JSON object")
  }
  return JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>
}

/** Translates short texts such as titles in one request, keyed like the input */
const translateShortTexts = async (texts: Record<string, string>, language: string) => {
  const reply = await chatCompletion([
    {
      role: "system",
      content: [
        `Translate every string value of the JSON object into ${language}.`,
        "Keep the keys unchanged and keep any HTML tags, URLs and code as they are.",
        "Return only a valid JSON object with exactly the same keys.",
      ].join(" "),
    },
    { role: "user", content: JSON.stringify(texts) },
  ])
  const json = parseJsonObject(reply)
  return Object.fromEntries(
    Object.entries(json).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
  )
}

const translateHtml = (html: string, language: string, mode: TranslationMode) =>
  chatCompletion([
    {
      role: "system",
      content:
        mode === "bilingual"
          ? [
              `Translate the HTML article into ${language} as a bilingual text.`,
              "Keep every original block element (p, h1-h6, li, blockquote, figcaption, td) and",
              "directly after each one insert a copy of it with the same tag whose text is translated.",
              "Leave code, pre, URLs, attribute values, images and other markup unchanged.",
              "Return only the resulting HTML, without code fences or explanations.",
            ].join(" ")
          : [
              `Translate the text of the HTML article into ${language}.`,
              "Keep all tags, attributes, images and links unchanged, and do not translate code, pre or URLs.",
              "Return only the translated HTML, without code fences or explanations.",
            ].join(" "),
    },
    { role: "user", content: html },
  ])

export type CustomAITranslationInput = { id: string } & Partial<
  Record<TranslationField, string | null>
>

/**
 * Translates the fields of entries, calling `onTranslated` for each entry as its translation
 * arrives: titles and descriptions in batches, contents one by one.
 */
export const customAITranslateEntries = async ({
  entries,
  fields,
  language,
  mode,
  onTranslated,
}: {
  entries: CustomAITranslationInput[]
  fields: TranslationField[]
  language: SupportedActionLanguage
  mode: TranslationMode
  onTranslated: (
    id: string,
    data: Partial<Record<TranslationField, string>>,
  ) => void | Promise<void>
}) => {
  const targetLanguage = languageName(language)
  const shortFields = fields.filter(
    (field): field is "title" | "description" => field === "title" || field === "description",
  )
  const contentFields = fields.filter(
    (field): field is "content" | "readabilityContent" =>
      field === "content" || field === "readabilityContent",
  )

  for (let i = 0; i < entries.length; i += SHORT_FIELD_BATCH_SIZE) {
    const batch = entries.slice(i, i + SHORT_FIELD_BATCH_SIZE)
    const texts: Record<string, string> = {}
    for (const entry of batch) {
      for (const field of shortFields) {
        const text = entry[field]
        if (text) texts[`${entry.id}.${field}`] = text
      }
    }
    if (Object.keys(texts).length === 0) continue

    const translated = await translateShortTexts(texts, targetLanguage)
    for (const entry of batch) {
      const data: Partial<Record<TranslationField, string>> = {}
      for (const field of shortFields) {
        const text = translated[`${entry.id}.${field}`]
        if (text) data[field] = text
      }
      if (Object.keys(data).length > 0) await onTranslated(entry.id, data)
    }
  }

  for (const entry of entries) {
    for (const field of contentFields) {
      const html = entry[field]
      if (!html) continue
      const translated = await translateHtml(html, targetLanguage, mode)
      if (translated) await onTranslated(entry.id, { [field]: translated })
    }
  }
}

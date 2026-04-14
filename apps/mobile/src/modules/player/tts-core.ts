import type { EntryModel } from "@follow/store/entry/types"
import { parseHtml } from "@follow/utils/html"

export const TTS_SERVICE_URL = "https://tts.folo.is"
export const DEFAULT_TTS_VOICE = "en-US-AvaMultilingualNeural"

export interface TtsVoice {
  FriendlyName: string
  Gender: string
  Locale: string
  ShortName: string
}

interface TtsVoiceResponse {
  voices: TtsVoice[]
}

interface TtsErrorResponse {
  error?: {
    message?: string
  }
}

const normalizeTtsText = (value: string) =>
  value
    .replaceAll("\r\n", "\n")
    .replaceAll(/[^\S\n]+/g, " ")
    .replaceAll(/\n{3,}/g, "\n\n")
    .trim()

const toPlainText = (value: string) => normalizeTtsText(parseHtml(value).toText())

const readTtsErrorMessage = async (response: Response) => {
  try {
    const data = (await response.clone().json()) as TtsErrorResponse
    return data?.error?.message || "TTS request failed"
  } catch {
    return "TTS request failed"
  }
}

export const getEntryTtsText = (
  entry: Pick<EntryModel, "content" | "description" | "readabilityContent" | "title">,
  options?: {
    preferReadability?: boolean
  },
) => {
  const { preferReadability = false } = options ?? {}

  const title = normalizeTtsText(entry.title || "")
  const bodySource = preferReadability
    ? entry.readabilityContent || entry.content || entry.description || ""
    : entry.content || entry.description || entry.readabilityContent || ""
  const body = bodySource ? toPlainText(bodySource) : ""

  return [title, body].filter(Boolean).join("\n\n")
}

export const fetchTtsVoices = async ({
  fetch,
  signal,
}: {
  fetch: typeof globalThis.fetch
  signal?: AbortSignal
}) => {
  const response = await fetch(`${TTS_SERVICE_URL}/voices`, { signal })

  if (!response.ok) {
    throw new Error(await readTtsErrorMessage(response))
  }

  const data = (await response.json()) as TtsVoiceResponse
  return data.voices ?? []
}

export const requestTtsBytes = async ({
  fetch,
  signal,
  text,
  voice,
}: {
  fetch: typeof globalThis.fetch
  signal?: AbortSignal
  text: string
  voice?: string
}) => {
  const normalizedText = normalizeTtsText(text)
  if (!normalizedText) {
    throw new Error("Text is required")
  }

  const normalizedVoice = voice?.trim()

  const response = await fetch(`${TTS_SERVICE_URL}/tts`, {
    body: JSON.stringify({
      text: normalizedText,
      ...(normalizedVoice ? { voice: normalizedVoice } : {}),
    }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
    signal,
  })

  if (!response.ok) {
    throw new Error(await readTtsErrorMessage(response))
  }

  if ("bytes" in response && typeof response.bytes === "function") {
    return response.bytes()
  }

  return new Uint8Array(await response.arrayBuffer())
}

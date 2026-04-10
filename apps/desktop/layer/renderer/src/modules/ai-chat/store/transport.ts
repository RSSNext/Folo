import { env } from "@follow/shared/env.desktop"
import { getActiveLocalByokConfig } from "@follow/shared/settings/byok-context"
import type { UserByokProviderConfig } from "@follow/shared/settings/interface"
import type { HttpChatTransportInitOptions, UIMessageChunk } from "ai"
import { HttpChatTransport, parseJsonEventStream, uiMessageChunkSchema } from "ai"

import { getAIModelState } from "../atoms/session"
import { AIPersistService } from "../services"
import type { BizUIMessage } from "./types"

type TitleHandlerPersistOption = boolean | ((title: string) => void | Promise<void>)

export interface TitleHandlerOptions {
  chatId?: string
  shouldHandle?: () => boolean
  onTitleChange?: (title: string) => void
  persist?: TitleHandlerPersistOption
}

export interface CreateChatTransportOptions {
  onValue?: (value: UIMessageChunk) => void
  titleHandler?: TitleHandlerOptions
}

export interface CreateChatTitleHandlerOptions {
  chatId: string
  getActiveChatId: () => string | null | undefined
  onTitleChange?: (title: string) => void
  persist?: TitleHandlerPersistOption
}

export function createChatTitleHandler(
  options: CreateChatTitleHandlerOptions,
): TitleHandlerOptions {
  const { chatId, getActiveChatId, onTitleChange, persist } = options

  return {
    chatId,
    persist,
    onTitleChange,
    shouldHandle: () => getActiveChatId() === chatId,
  }
}

/**
 * Create a chat transport for AI SDK
 * This is used by the AbstractChat instance to communicate with AI providers
 */
export function createChatTransport({ onValue, titleHandler }: CreateChatTransportOptions = {}) {
  // Check for local BYOK provider
  const localByokConfig = getActiveLocalByokConfig()
  if (localByokConfig) {
    return createLocalByokChatTransport({ onValue, titleHandler, config: localByokConfig })
  }

  return new ExtendChatTransport({
    onValue,
    titleHandler,
    // Custom fetch configuration
    api: `${env.VITE_API_URL}/ai/chat`,
    credentials: "include",
    // Add selected model to request body
    body: () => {
      const modelState = getAIModelState()
      const { selectedModel } = modelState

      return selectedModel ? { model: selectedModel } : {}
    },
  })
}

function getLocalProviderCompletionsURL(config: UserByokProviderConfig): string {
  const baseURL = (config.baseURL || getDefaultBaseURL(config.provider)).replace(/\/+$/, "")

  switch (config.provider) {
    case "ollama": {
      return `${baseURL}/v1/chat/completions`
    }
    default: {
      return `${baseURL}/chat/completions`
    }
  }
}

function getDefaultBaseURL(provider: string): string {
  switch (provider) {
    case "ollama": {
      return "http://127.0.0.1:11434"
    }
    case "lmstudio": {
      return "http://127.0.0.1:1234/v1"
    }
    case "openrouter": {
      return "https://openrouter.ai/api/v1"
    }
    case "mlx-vlm": {
      return "http://127.0.0.1:8000/v1"
    }
    default: {
      return ""
    }
  }
}

function createLocalByokChatTransport({
  onValue,
  titleHandler,
  config,
}: CreateChatTransportOptions & { config: UserByokProviderConfig }) {
  const apiURL = getLocalProviderCompletionsURL(config)

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }
  if (config.apiKey) {
    headers.Authorization = `Bearer ${config.apiKey}`
  }
  if (config.provider === "openrouter") {
    headers["HTTP-Referer"] = globalThis.location?.origin ?? "https://app.folo.is"
    headers["X-Title"] = "Folo"
  }
  if (config.headers) {
    Object.assign(headers, config.headers)
  }

  return new LocalByokChatTransport({
    onValue,
    titleHandler,
    api: apiURL,
    headers,
    body: () => {
      return {
        model: config.model ?? "",
        stream: true,
      }
    },
  })
}

type UIMessageChunkParseResult =
  ReturnType<typeof parseJsonEventStream<UIMessageChunk>> extends ReadableStream<infer T>
    ? T
    : never

const coerceFinishChunk = (chunk: UIMessageChunkParseResult): UIMessageChunk | null => {
  const { rawValue } = chunk
  if (!rawValue || typeof rawValue !== "object" || Array.isArray(rawValue)) {
    return null
  }

  if ((rawValue as { type?: unknown }).type !== "finish") {
    return null
  }

  const { finishReason, messageMetadata } = rawValue as {
    finishReason?: unknown
    messageMetadata?: unknown
  }

  return {
    type: "finish",
    finishReason: typeof finishReason === "string" ? finishReason : undefined,
    messageMetadata,
  } as UIMessageChunk
}

class ExtendChatTransport extends HttpChatTransport<BizUIMessage> {
  constructor(
    private options: HttpChatTransportInitOptions<BizUIMessage> & {
      onValue?: (value: UIMessageChunk) => void
      titleHandler?: TitleHandlerOptions
    },
  ) {
    super(options)
  }

  protected processResponseStream(
    stream: ReadableStream<Uint8Array<ArrayBufferLike>>,
  ): ReadableStream<UIMessageChunk> {
    const { onValue } = this.options || {}
    const handleGeneratedTitle = this.handleGeneratedTitle.bind(this)
    return parseJsonEventStream({
      stream,
      schema: uiMessageChunkSchema,
    }).pipeThrough(
      new TransformStream<UIMessageChunkParseResult, UIMessageChunk>({
        async transform(chunk, controller) {
          const parsedChunk = chunk.success ? chunk.value : coerceFinishChunk(chunk)
          if (!parsedChunk) {
            throw chunk.error
          }

          await handleGeneratedTitle(parsedChunk)
          onValue?.(parsedChunk)
          controller.enqueue(parsedChunk)
        },
      }),
    )
  }

  private async handleGeneratedTitle(chunk: UIMessageChunk) {
    const { titleHandler } = this.options
    if (!titleHandler) {
      return
    }

    if (chunk.type !== "data-generated-title" || typeof chunk.data !== "string") {
      return
    }

    const shouldHandle = titleHandler.shouldHandle?.() ?? true
    if (!shouldHandle) {
      return
    }

    titleHandler.onTitleChange?.(chunk.data)

    const persistOption = titleHandler.persist
    const shouldPersist = persistOption === undefined ? true : persistOption

    if (!shouldPersist) {
      return
    }

    try {
      if (typeof persistOption === "function") {
        await persistOption(chunk.data)
        return
      }

      if (titleHandler.chatId) {
        await AIPersistService.updateSessionTitle(titleHandler.chatId, chunk.data)
      }
    } catch (error) {
      console.error("Failed to persist generated title:", error)
    }
  }

  override reconnectToStream(
    options: Parameters<HttpChatTransport<BizUIMessage>["reconnectToStream"]>[0],
  ) {
    options.chatId = encodeURIComponent(options.chatId)
    return super.reconnectToStream(options)
  }
}

/**
 * Transport for local BYOK providers (Ollama, LM Studio, etc.)
 * Converts OpenAI-compatible SSE streaming responses to AI SDK UIMessageChunk format
 */
class LocalByokChatTransport extends HttpChatTransport<BizUIMessage> {
  constructor(
    private localOptions: HttpChatTransportInitOptions<BizUIMessage> & {
      onValue?: (value: UIMessageChunk) => void
      titleHandler?: TitleHandlerOptions
    },
  ) {
    super(localOptions)
  }

  protected processResponseStream(
    stream: ReadableStream<Uint8Array<ArrayBufferLike>>,
  ): ReadableStream<UIMessageChunk> {
    const { onValue } = this.localOptions || {}
    let messageId = `msg-${Date.now()}`

    return new ReadableStream<UIMessageChunk>({
      async start(controller) {
        const reader = stream.getReader()
        const decoder = new TextDecoder()
        let buffer = ""
        let sentStart = false

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split("\n")
            buffer = lines.pop() ?? ""

            for (const line of lines) {
              const trimmed = line.trim()
              if (!trimmed || !trimmed.startsWith("data: ")) continue

              const data = trimmed.slice(6)
              if (data === "[DONE]") {
                // Emit finish chunk
                const finishChunk: UIMessageChunk = {
                  type: "finish",
                  finishReason: "stop",
                } as UIMessageChunk
                onValue?.(finishChunk)
                controller.enqueue(finishChunk)
                continue
              }

              try {
                const parsed = JSON.parse(data) as {
                  id?: string
                  choices?: {
                    delta?: { content?: string; role?: string }
                    finish_reason?: string | null
                  }[]
                }

                if (parsed.id) {
                  messageId = parsed.id
                }

                const delta = parsed.choices?.[0]?.delta

                // Emit start chunk on first content
                if (!sentStart && delta) {
                  const startChunk = {
                    type: "start",
                    messageId,
                  } as UIMessageChunk
                  onValue?.(startChunk)
                  controller.enqueue(startChunk)
                  sentStart = true
                }

                if (delta?.content) {
                  const textChunk = {
                    type: "text" as const,
                    text: delta.content,
                  } as unknown as UIMessageChunk
                  onValue?.(textChunk)
                  controller.enqueue(textChunk)
                }

                // Handle finish_reason in the chunk itself
                if (parsed.choices?.[0]?.finish_reason === "stop") {
                  const finishChunk: UIMessageChunk = {
                    type: "finish",
                    finishReason: "stop",
                  } as UIMessageChunk
                  onValue?.(finishChunk)
                  controller.enqueue(finishChunk)
                }
              } catch {
                // Skip malformed chunks
              }
            }
          }
        } catch (error) {
          controller.error(error)
        } finally {
          reader.releaseLock()
          controller.close()
        }
      },
    })
  }
}

import type { ByokProviderName, UserByokProviderConfig } from "@follow/shared/settings/interface"

export interface ByokChatMessage {
  role: "system" | "user" | "assistant"
  content: string
}

export interface ByokCompletionOptions {
  messages: ByokChatMessage[]
  model?: string
  stream?: boolean
  temperature?: number
  maxTokens?: number
  signal?: AbortSignal
}

export interface ByokCompletionResult {
  content: string
  model?: string
  usage?: {
    promptTokens?: number
    completionTokens?: number
    totalTokens?: number
  }
}

interface OpenAICompletionResponse {
  choices: { message: { content: string }; finish_reason: string }[]
  model?: string
  usage?: {
    prompt_tokens?: number
    completion_tokens?: number
    total_tokens?: number
  }
}

interface OpenAIStreamChunk {
  choices: { delta: { content?: string; role?: string }; finish_reason: string | null }[]
}

function getCompletionsURL(provider: ByokProviderName, baseURL: string): string {
  const trimmedURL = baseURL.replace(/\/+$/, "")

  switch (provider) {
    case "ollama": {
      return `${trimmedURL}/v1/chat/completions`
    }
    case "lmstudio":
    case "openai-compatible":
    case "mlx-vlm":
    case "openrouter":
    case "openai": {
      return `${trimmedURL}/chat/completions`
    }
    default: {
      return `${trimmedURL}/chat/completions`
    }
  }
}

function buildHeaders(config: UserByokProviderConfig): Record<string, string> {
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

  return headers
}

function getEffectiveBaseURL(config: UserByokProviderConfig): string {
  if (config.baseURL) return config.baseURL

  switch (config.provider) {
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

export async function byokCompletion(
  config: UserByokProviderConfig,
  options: ByokCompletionOptions,
): Promise<ByokCompletionResult> {
  const baseURL = getEffectiveBaseURL(config)
  if (!baseURL) {
    throw new Error("No base URL configured for provider")
  }

  const url = getCompletionsURL(config.provider, baseURL)
  const headers = buildHeaders(config)

  const body: Record<string, unknown> = {
    messages: options.messages,
    model: options.model ?? config.model ?? "",
    stream: false,
  }

  if (options.temperature !== undefined) {
    body.temperature = options.temperature
  }
  if (options.maxTokens !== undefined) {
    body.max_tokens = options.maxTokens
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal: options.signal,
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error")
    throw new Error(`Provider returned ${response.status}: ${errorText}`)
  }

  const data = (await response.json()) as OpenAICompletionResponse

  const choice = data.choices?.[0]
  if (!choice) {
    throw new Error("No completion choice returned from provider")
  }

  return {
    content: choice.message.content ?? "",
    model: data.model,
    usage: data.usage
      ? {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        }
      : undefined,
  }
}

export async function* byokStreamCompletion(
  config: UserByokProviderConfig,
  options: ByokCompletionOptions,
): AsyncGenerator<string> {
  const baseURL = getEffectiveBaseURL(config)
  if (!baseURL) {
    throw new Error("No base URL configured for provider")
  }

  const url = getCompletionsURL(config.provider, baseURL)
  const headers = buildHeaders(config)

  const body: Record<string, unknown> = {
    messages: options.messages,
    model: options.model ?? config.model ?? "",
    stream: true,
  }

  if (options.temperature !== undefined) {
    body.temperature = options.temperature
  }
  if (options.maxTokens !== undefined) {
    body.max_tokens = options.maxTokens
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal: options.signal,
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error")
    throw new Error(`Provider returned ${response.status}: ${errorText}`)
  }

  if (!response.body) {
    throw new Error("No response body for streaming")
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""

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
        if (data === "[DONE]") return

        try {
          const chunk = JSON.parse(data) as OpenAIStreamChunk
          const content = chunk.choices?.[0]?.delta?.content
          if (content) {
            yield content
          }
        } catch {
          // Skip malformed chunks
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}

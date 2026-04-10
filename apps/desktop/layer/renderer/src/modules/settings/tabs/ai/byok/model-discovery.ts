import type { ByokProviderName } from "@follow/shared/settings/interface"

export interface DiscoveredModel {
  id: string
  name: string
  description?: string
}

interface OllamaTagsResponse {
  models: { name: string; modified_at?: string; size?: number }[]
}

interface OpenAIModelsResponse {
  data: { id: string; object?: string; owned_by?: string }[]
}

interface OpenRouterModel {
  id: string
  name: string
  description?: string
  pricing?: { prompt: string; completion: string }
  context_length?: number
}

interface OpenRouterModelsResponse {
  data: OpenRouterModel[]
}

// In-memory cache for OpenRouter models
let openRouterCache: { models: DiscoveredModel[]; timestamp: number } | null = null
const OPENROUTER_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

async function discoverOllamaModels(baseURL: string): Promise<DiscoveredModel[]> {
  const url = `${baseURL.replace(/\/+$/, "")}/api/tags`
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Ollama returned ${response.status}`)
  }

  const data = (await response.json()) as OllamaTagsResponse
  return (data.models ?? []).map((m) => ({
    id: m.name,
    name: m.name,
  }))
}

async function discoverOpenAICompatibleModels(
  baseURL: string,
  apiKey?: string | null,
): Promise<DiscoveredModel[]> {
  const url = `${baseURL.replace(/\/+$/, "")}/models`
  const headers: Record<string, string> = {}
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`
  }

  const response = await fetch(url, { headers })

  if (!response.ok) {
    throw new Error(`Server returned ${response.status}`)
  }

  const data = (await response.json()) as OpenAIModelsResponse
  return (data.data ?? []).map((m) => ({
    id: m.id,
    name: m.id,
  }))
}

async function discoverOpenRouterModels(apiKey?: string | null): Promise<DiscoveredModel[]> {
  // Check cache
  if (openRouterCache && Date.now() - openRouterCache.timestamp < OPENROUTER_CACHE_TTL) {
    return openRouterCache.models
  }

  const headers: Record<string, string> = {}
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`
  }

  const response = await fetch("https://openrouter.ai/api/v1/models", { headers })

  if (!response.ok) {
    throw new Error(`OpenRouter returned ${response.status}`)
  }

  const data = (await response.json()) as OpenRouterModelsResponse
  const models = (data.data ?? []).map((m) => ({
    id: m.id,
    name: m.name || m.id,
    description: m.description,
  }))

  // Update cache
  openRouterCache = { models, timestamp: Date.now() }

  return models
}

export async function discoverModels(
  provider: ByokProviderName,
  baseURL: string,
  apiKey?: string | null,
): Promise<DiscoveredModel[]> {
  switch (provider) {
    case "ollama": {
      return discoverOllamaModels(baseURL)
    }
    case "lmstudio":
    case "openai-compatible": {
      return discoverOpenAICompatibleModels(baseURL, apiKey)
    }
    case "openrouter": {
      return discoverOpenRouterModels(apiKey)
    }
    case "mlx-vlm": {
      // Attempt OpenAI-compatible discovery, fallback to empty
      try {
        return await discoverOpenAICompatibleModels(baseURL, apiKey)
      } catch {
        return []
      }
    }
    default: {
      return []
    }
  }
}

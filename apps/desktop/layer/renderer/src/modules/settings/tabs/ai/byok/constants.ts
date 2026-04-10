import type { ByokProviderName } from "@follow/shared/settings/interface"

export type ProviderCategory = "cloud" | "local"

export interface ProviderOption {
  value: ByokProviderName
  label: string
  category: ProviderCategory
  defaultBaseURL?: string
  apiKeyRequired: boolean
  supportsModelDiscovery: boolean
  modelListEndpoint?: string
}

export const PROVIDER_OPTIONS: ProviderOption[] = [
  // Cloud providers
  {
    value: "openai",
    label: "OpenAI",
    category: "cloud",
    apiKeyRequired: true,
    supportsModelDiscovery: false,
  },
  {
    value: "google",
    label: "Google",
    category: "cloud",
    apiKeyRequired: true,
    supportsModelDiscovery: false,
  },
  {
    value: "vercel-ai-gateway",
    label: "Vercel AI Gateway",
    category: "cloud",
    apiKeyRequired: true,
    supportsModelDiscovery: false,
  },
  {
    value: "openrouter",
    label: "OpenRouter",
    category: "cloud",
    defaultBaseURL: "https://openrouter.ai/api/v1",
    apiKeyRequired: true,
    supportsModelDiscovery: true,
    modelListEndpoint: "/models",
  },
  // Local providers
  {
    value: "ollama",
    label: "Ollama",
    category: "local",
    defaultBaseURL: "http://127.0.0.1:11434",
    apiKeyRequired: false,
    supportsModelDiscovery: true,
    modelListEndpoint: "/api/tags",
  },
  {
    value: "lmstudio",
    label: "LM Studio",
    category: "local",
    defaultBaseURL: "http://127.0.0.1:1234/v1",
    apiKeyRequired: false,
    supportsModelDiscovery: true,
    modelListEndpoint: "/models",
  },
  {
    value: "openai-compatible",
    label: "OpenAI Compatible",
    category: "local",
    apiKeyRequired: false,
    supportsModelDiscovery: true,
    modelListEndpoint: "/models",
  },
  {
    value: "mlx-vlm",
    label: "MLX-vlm",
    category: "local",
    defaultBaseURL: "http://127.0.0.1:8000/v1",
    apiKeyRequired: false,
    supportsModelDiscovery: false,
  },
]

export const getProviderOption = (name: ByokProviderName): ProviderOption | undefined =>
  PROVIDER_OPTIONS.find((p) => p.value === name)

export const isLocalProvider = (name: ByokProviderName): boolean =>
  getProviderOption(name)?.category === "local"

export const CLOUD_PROVIDERS = PROVIDER_OPTIONS.filter((p) => p.category === "cloud")
export const LOCAL_PROVIDERS = PROVIDER_OPTIONS.filter((p) => p.category === "local")

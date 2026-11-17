import { createZustandStore } from "../../lib/helper"

/**
 * An OpenAI-compatible API the user brings, which AI summaries and translations call directly
 * instead of the Folo server. Each app loads and saves it in its own secure storage; it is never
 * part of the settings synced to the server.
 */
export interface CustomAIConfig {
  enabled: boolean
  /** Such as https://api.openai.com/v1, the path that `/chat/completions` is appended to */
  baseURL: string
  apiKey: string
  model: string
}

export const DEFAULT_CUSTOM_AI_BASE_URL = "https://api.openai.com/v1"

export const createDefaultCustomAIConfig = (): CustomAIConfig => ({
  enabled: false,
  baseURL: DEFAULT_CUSTOM_AI_BASE_URL,
  apiKey: "",
  model: "",
})

export const useCustomAIStore = createZustandStore<CustomAIConfig>("customAI")(() =>
  createDefaultCustomAIConfig(),
)

export const getCustomAIConfig = () => useCustomAIStore.getState()

export const setCustomAIConfig = (config: CustomAIConfig) => {
  useCustomAIStore.setState({ ...config })
}

/** Whether AI requests go to the user's own API: it is turned on and has an address and model */
export const isCustomAIReady = (config: CustomAIConfig = getCustomAIConfig()) =>
  config.enabled && !!config.baseURL.trim() && !!config.model.trim()

export const useIsCustomAIReady = () => useCustomAIStore((state) => isCustomAIReady(state))

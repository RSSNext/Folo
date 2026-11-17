import type { CustomAIConfig } from "@follow/store/custom-ai/store"
import { createDefaultCustomAIConfig, setCustomAIConfig } from "@follow/store/custom-ai/store"

import { safeSecureStore } from "./secure-store"

// expo-secure-store keys may only contain letters, digits, ".", "-" and "_"
const STORAGE_KEY = "custom_ai_config"

const pickConfig = (value: unknown): CustomAIConfig => {
  const defaults = createDefaultCustomAIConfig()
  if (!value || typeof value !== "object") return defaults
  const raw = value as Partial<Record<keyof CustomAIConfig, unknown>>
  return {
    enabled: typeof raw.enabled === "boolean" ? raw.enabled : defaults.enabled,
    baseURL: typeof raw.baseURL === "string" ? raw.baseURL : defaults.baseURL,
    apiKey: typeof raw.apiKey === "string" ? raw.apiKey : defaults.apiKey,
    model: typeof raw.model === "string" ? raw.model : defaults.model,
  }
}

/**
 * Loads the user's own AI API from the keychain into the store. It stays on this device: the
 * key is not part of the settings synced to the Folo server.
 */
export const loadCustomAIConfig = () => {
  try {
    const raw = safeSecureStore.getItem(STORAGE_KEY)
    if (!raw) return
    setCustomAIConfig(pickConfig(JSON.parse(raw)))
  } catch (error) {
    console.warn("[custom-ai] Failed to load the config", error)
  }
}

export const saveCustomAIConfig = (config: CustomAIConfig) => {
  const normalized: CustomAIConfig = {
    enabled: config.enabled,
    baseURL: config.baseURL.trim(),
    apiKey: config.apiKey.trim(),
    model: config.model.trim(),
  }
  safeSecureStore.setItem(STORAGE_KEY, JSON.stringify(normalized))
  setCustomAIConfig(normalized)
}

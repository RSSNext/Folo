import type { UserByokProviderConfig } from "@follow/shared/settings/interface"

import { discoverModels } from "./model-discovery"

export interface ConnectionTestResult {
  success: boolean
  error?: string
  modelVerified?: boolean
  modelsAvailable?: number
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

export async function testConnection(
  config: UserByokProviderConfig,
): Promise<ConnectionTestResult> {
  const baseURL = getEffectiveBaseURL(config)
  if (!baseURL) {
    return { success: false, error: "No base URL configured" }
  }

  try {
    // Step 1: Try to discover models (this validates endpoint reachability + auth)
    const models = await discoverModels(config.provider, baseURL, config.apiKey)

    // Step 2: If model is specified, verify it exists
    if (config.model && models.length > 0) {
      const modelExists = models.some((m) => m.id === config.model)
      if (!modelExists) {
        return {
          success: true,
          modelVerified: false,
          modelsAvailable: models.length,
          error: `Model "${config.model}" not found. ${models.length} models available.`,
        }
      }
      return { success: true, modelVerified: true, modelsAvailable: models.length }
    }

    return { success: true, modelsAvailable: models.length }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"

    // Provide actionable error messages
    if (message.includes("Failed to fetch") || message.includes("NetworkError")) {
      const isLocal =
        baseURL.includes("127.0.0.1") || baseURL.includes("localhost") || baseURL.includes("[::1]")
      if (isLocal) {
        return {
          success: false,
          error: `Cannot reach ${baseURL}. Make sure the provider is running and CORS is enabled.`,
        }
      }
      return { success: false, error: `Cannot reach ${baseURL}. Check the URL and try again.` }
    }

    if (message.includes("401") || message.includes("403")) {
      return { success: false, error: "Authentication failed. Check your API key." }
    }

    if (message.includes("CORS") || message.includes("cross-origin")) {
      return {
        success: false,
        error: "CORS error. Configure your local provider to allow cross-origin requests.",
      }
    }

    return { success: false, error: message }
  }
}

import { env } from "@follow/shared/env.desktop"
import { DefaultChatTransport } from "ai"

import { getAIModelState } from "../atoms/session"

/**
 * Create a chat transport for AI SDK
 * This is used by the AbstractChat instance to communicate with AI providers
 */
export function createChatTransport() {
  return new DefaultChatTransport({
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

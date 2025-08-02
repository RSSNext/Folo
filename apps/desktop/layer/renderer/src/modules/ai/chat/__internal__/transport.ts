import { env } from "@follow/shared/env.desktop"
import { DefaultChatTransport } from "ai"

/**
 * Create a chat transport for AI SDK
 * This is used by the AbstractChat instance to communicate with AI providers
 */
export function createChatTransport() {
  return new DefaultChatTransport({
    // Custom fetch configuration
    api: `${env.VITE_API_URL}/ai/chat`,
    credentials: "include",
  })
}

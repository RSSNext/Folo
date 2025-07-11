import type { UIMessage } from "ai"

import { apiClient } from "~/lib/api-fetch"

export const generateChatTitle = async (messages: UIMessage[]) => {
  if (messages.length < 2) return null

  try {
    // Take the first 2 messages for title generation (user + first AI response)
    const relevantMessages = messages.slice(0, 2).map((msg) => {
      // Extract text content from parts array (AI SDK v5 format)
      let content = ""
      if (msg.parts && Array.isArray(msg.parts)) {
        content = msg.parts
          .filter((part: any) => part.type === "text")
          .map((part: any) => part.text)
          .join(" ")
      }

      return {
        role: msg.role,
        content,
      }
    })

    const response = await apiClient.ai["summary-title"].$post({
      json: { messages: relevantMessages },
    })

    if ("title" in response) {
      return response.title
    }

    return null
  } catch (error) {
    console.error("Failed to generate chat title:", error)
    return null
  }
}

import { apiClient } from "~/lib/api-fetch"

export const generateChatTitle = async (messages: any[]) => {
  if (messages.length < 4) return null

  try {
    // Take the first 4 messages for title generation
    const relevantMessages = messages.slice(0, 4).map((msg) => ({
      role: msg.role,
      content: msg.content,
    }))

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

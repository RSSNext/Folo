import { createContext, use } from "react"

export const AIMessageIdContext = createContext<string | null>(null)

export const useAIMessageId = () => {
  const ctx = use(AIMessageIdContext)
  if (!ctx && import.meta.env.DEV) {
    throw new Error("useAIMessageId must be used within a AIMessageIdContext")
  }
  return ctx
}

export const useAIMessageOptionalId = () => {
  const ctx = use(AIMessageIdContext)
  return ctx
}

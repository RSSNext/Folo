import type { UseChatHelpers } from "@ai-sdk/react"
import { createContext } from "react"

export const AIChatContext = createContext<UseChatHelpers>(null!)

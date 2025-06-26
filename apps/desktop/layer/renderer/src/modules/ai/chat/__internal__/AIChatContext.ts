import type { UseChatHelpers } from "@ai-sdk/react"
import { createContext } from "react"

export const AIChatContext = createContext<UseChatHelpers>(null!)

export type AIPanelRefs = {
  panelRef: React.RefObject<HTMLDivElement>
  inputRef: React.RefObject<HTMLTextAreaElement>
}

export const AIPanelRefsContext = createContext<AIPanelRefs>(null!)

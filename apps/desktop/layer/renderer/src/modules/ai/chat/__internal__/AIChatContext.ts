import type { UIMessage, UseChatHelpers } from "@ai-sdk/react"
import type { UIDataTypes } from "ai"
import { createContext, use } from "react"
import type { StoreApi } from "zustand"
import type { UseBoundStoreWithEqualityFn } from "zustand/traditional"

import type { AiChatContextStore } from "./store"
import type { BizUIMetadata, BizUITools } from "./types"

export const AIChatContext = createContext<
  UseChatHelpers<UIMessage<BizUIMetadata, UIDataTypes, BizUITools>>
>(null!)

export type AIPanelRefs = {
  panelRef: React.RefObject<HTMLDivElement>
  inputRef: React.RefObject<HTMLTextAreaElement>
}

export const AIPanelRefsContext = createContext<AIPanelRefs>(null!)

export const AIChatContextStoreContext = createContext<
  UseBoundStoreWithEqualityFn<StoreApi<AiChatContextStore>>
>(null!)

// Hook to access AI chat context information
export const useAIChatStore = () => {
  const store = use(AIChatContextStoreContext)
  if (!store && import.meta.env.DEV) {
    throw new Error("useAIChatStore must be used within a AIChatContextStoreContext")
  }
  return store
}

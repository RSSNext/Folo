import { createContext, use } from "react"
import type { StoreApi } from "zustand"
import type { UseBoundStoreWithEqualityFn } from "zustand/traditional"

import type { AiChatStore } from "./store"

export type AIPanelRefs = {
  panelRef: React.RefObject<HTMLDivElement>
  inputRef: React.RefObject<HTMLTextAreaElement>
}

export const AIPanelRefsContext = createContext<AIPanelRefs>(null!)

export const AIChatStoreContext = createContext<UseBoundStoreWithEqualityFn<StoreApi<AiChatStore>>>(
  null!,
)

export const useAIChatStore = () => {
  const store = use(AIChatStoreContext)
  if (!store && import.meta.env.DEV) {
    throw new Error("useAIChatStore must be used within a AIChatStoreContext")
  }
  return store
}

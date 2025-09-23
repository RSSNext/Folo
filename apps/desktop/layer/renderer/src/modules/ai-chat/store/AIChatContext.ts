import type { LexicalRichEditorRef } from "@follow/components/ui/lexical-rich-editor/types.js"
import type { PrimitiveAtom } from "jotai"
import { createContext, use } from "react"
import type { StoreApi } from "zustand"
import type { UseBoundStoreWithEqualityFn } from "zustand/traditional"

import type { AiChatStore } from "./store"

export type AIPanelRefs = {
  inputRef: React.RefObject<LexicalRichEditorRef>
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

export type AIRootStateContext = {
  isScrolledBeyondThreshold: PrimitiveAtom<boolean>
}

export const AIRootStateContext = createContext<AIRootStateContext>(null!)

export const useAIRootState = () => {
  const context = use(AIRootStateContext)
  if (!context) {
    throw new Error("useAIRootState must be used within a AIRootStateContext")
  }
  return context
}

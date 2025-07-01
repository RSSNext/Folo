import type { UseChatHelpers } from "@ai-sdk/react"
import { merge } from "es-toolkit/compat"
import type { Dispatch, SetStateAction } from "react"
import { createContext, use, useCallback } from "react"

export const AIChatContext = createContext<UseChatHelpers>(null!)

export type AIPanelRefs = {
  panelRef: React.RefObject<HTMLDivElement>
  inputRef: React.RefObject<HTMLTextAreaElement>
}

export const AIPanelRefsContext = createContext<AIPanelRefs>(null!)

export interface AIChatContextInfo {
  entryId?: string
  feedId?: string
  selectedText?: string
}

export const AIChatContextInfoContext = createContext<AIChatContextInfo>({})

export const AIChatSetContextInfoContext = createContext<
  Dispatch<SetStateAction<AIChatContextInfo>>
>(null!)

// Hook to access AI chat context information
export const useAIChatContextInfo = () => {
  return use(AIChatContextInfoContext)
}

export const useAIChatSetContextInfo = () => {
  const setContextInfo = use(AIChatSetContextInfoContext)
  return useCallback(
    (info: AIChatContextInfo) => {
      setContextInfo((prev) => merge(prev, info))
    },
    [setContextInfo],
  )
}

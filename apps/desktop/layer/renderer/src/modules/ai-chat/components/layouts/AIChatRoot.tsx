import type { LexicalRichEditorRef } from "@follow/components/ui/lexical-rich-editor/types.js"
import { atom } from "jotai"
import type { FC, PropsWithChildren } from "react"
import { useEffect, useMemo, useRef } from "react"

import { Focusable } from "~/components/common/Focusable"
import { HotkeyScope } from "~/constants"

import { useAIShortcut } from "../../hooks/useAIShortcut"
import type { AIPanelRefs } from "../../store/AIChatContext"
import {
  AIChatStoreContext,
  AIPanelRefsContext,
  AIRootStateContext,
} from "../../store/AIChatContext"
import { ChatSliceActions } from "../../store/chat-core/chat-actions"
import { useChatActions, useCurrentChatId } from "../../store/hooks"
import { createAIChatStore } from "../../store/store"

interface AIChatRootProps extends PropsWithChildren {
  wrapFocusable?: boolean
  chatId?: string
}

const AIChatRootInner: FC<AIChatRootProps> = ({ children, chatId: externalChatId }) => {
  const currentChatId = useCurrentChatId()

  const chatActions = useChatActions()

  useMemo(() => {
    if (!currentChatId && !externalChatId) {
      chatActions.newChat()
    }
  }, [currentChatId, externalChatId, chatActions])

  const inputRef = useRef<LexicalRichEditorRef>(null!)
  const refsContext = useMemo<AIPanelRefs>(() => ({ inputRef }), [inputRef])
  useAIShortcut()

  if (!currentChatId) {
    return (
      <div className="bg-background flex size-full items-center justify-center">
        <div className="flex items-center gap-2">
          <i className="i-mgc-loading-3-cute-re text-text size-6 animate-spin" />
          <span className="text-text-secondary">Initializing chat...</span>
        </div>
      </div>
    )
  }

  return <AIPanelRefsContext value={refsContext}>{children}</AIPanelRefsContext>
}

export const AIChatRoot: FC<AIChatRootProps> = ({
  children,
  wrapFocusable = true,
  chatId: externalChatId,
}) => {
  const useAiContextStore = useMemo(createAIChatStore, [])
  const chatActions = useAiContextStore((state) => state.chatActions)

  useEffect(() => {
    ChatSliceActions.setActiveInstance(chatActions)
  }, [chatActions])

  const Element = (
    <AIChatStoreContext value={useAiContextStore}>
      <AIRootStateContext
        value={useMemo(
          () => ({
            isScrolledBeyondThreshold: atom(false),
          }),
          [],
        )}
      >
        <AIChatRootInner chatId={externalChatId}>{children}</AIChatRootInner>
      </AIRootStateContext>
    </AIChatStoreContext>
  )

  if (wrapFocusable) {
    return (
      <Focusable scope={HotkeyScope.AIChat} className="size-full">
        {Element}
      </Focusable>
    )
  }
  return Element
}
AIChatRoot.displayName = "AIChatRoot"

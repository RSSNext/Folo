import type { LexicalRichEditorRef } from "@follow/components/ui/lexical-rich-editor/types.js"
import type { IdGenerator } from "ai"
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
  generateId?: IdGenerator
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
      <div className="flex size-full items-center justify-center bg-background">
        <div className="flex items-center gap-2">
          <i className="i-mgc-loading-3-cute-re size-6 animate-spin text-text" />
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
  generateId,
}) => {
  const stableGenerateIdFn = useRef(generateId)
  stableGenerateIdFn.current = generateId

  const useAiContextStore = useMemo(
    () => createAIChatStore({ chatId: externalChatId, generateId: stableGenerateIdFn.current }),
    [externalChatId],
  )
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

import type { FC, PropsWithChildren } from "react"
import { useMemo, useRef } from "react"

import { Focusable } from "~/components/common/Focusable"
import { HotkeyScope } from "~/constants"

import type { AIPanelRefs } from "../../store/AIChatContext"
import { AIChatStoreContext, AIPanelRefsContext } from "../../store/AIChatContext"
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

  const panelRef = useRef<HTMLDivElement>(null!)
  const inputRef = useRef<HTMLTextAreaElement>(null!)
  const refsContext = useMemo<AIPanelRefs>(() => ({ panelRef, inputRef }), [panelRef, inputRef])

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

  const Element = (
    <AIChatStoreContext value={useAiContextStore}>
      <AIChatRootInner chatId={externalChatId}>{children}</AIChatRootInner>
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

import { useElementWidth } from "@follow/hooks"
import type { CSSProperties, FC, RefObject } from "react"
import { Suspense, useRef } from "react"

import { AIChatMessage } from "~/modules/ai-chat/components/message/AIChatMessage"
import { ErrorMessage } from "~/modules/ai-chat/components/message/ErrorMessage"
import { UserChatMessage } from "~/modules/ai-chat/components/message/UserChatMessage"
import { useChatError, useMessages } from "~/modules/ai-chat/store/hooks"

interface MessagesProps {
  contentRef?: RefObject<HTMLDivElement | null>
}

export const Messages: FC<MessagesProps> = ({ contentRef }) => {
  const messages = useMessages()
  const error = useChatError()
  const fallbackRef = useRef<HTMLDivElement>(null)
  const effectiveRef = contentRef ?? fallbackRef

  const messageContainerWidth = useElementWidth(effectiveRef)

  const style = messageContainerWidth
    ? ({ "--ai-chat-message-container-width": `${messageContainerWidth}px` } as CSSProperties)
    : undefined

  return (
    <div ref={effectiveRef} className="relative flex min-w-0 flex-1 flex-col" style={style}>
      {!!messageContainerWidth &&
        messages.map((message, index) => {
          const isLastMessage = index === messages.length - 1
          return (
            <Suspense key={message.id}>
              {message.role === "user" ? (
                <UserChatMessage message={message} />
              ) : (
                <AIChatMessage message={message} isLastMessage={isLastMessage} />
              )}
            </Suspense>
          )
        })}
      {!!messageContainerWidth && error && <ErrorMessage error={error} />}
    </div>
  )
}

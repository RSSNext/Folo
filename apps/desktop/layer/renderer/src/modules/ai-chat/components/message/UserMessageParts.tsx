import * as React from "react"

import type { BizUIMessage } from "~/modules/ai-chat/store/types"

import { AIMarkdownStreamingMessage } from "./AIMarkdownMessage"
import { UserRichTextMessage } from "./UserRichTextMessage"

interface UserMessagePartsProps {
  message: BizUIMessage
}

export const UserMessageParts: React.FC<UserMessagePartsProps> = React.memo(({ message }) => {
  return message.parts.map((part, index) => {
    const partKey = `${message.id}-${index}`

    switch (part.type) {
      case "text": {
        return <AIMarkdownStreamingMessage isStreaming={false} key={partKey} text={part.text} />
      }

      case "data-block": {
        // Skip data-block rendering here since it's handled separately in UserChatMessage
        return null
      }

      case "data-rich-text": {
        return (
          <UserRichTextMessage
            key={partKey}
            data={part.data as { state: string; text: string }}
            className="text-text"
          />
        )
      }

      default: {
        return null
      }
    }
  })
})

UserMessageParts.displayName = "UserMessageParts"

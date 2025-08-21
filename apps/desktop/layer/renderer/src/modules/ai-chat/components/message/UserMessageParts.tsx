import * as React from "react"

import type { AIChatContextBlock, BizUIMessage } from "~/modules/ai-chat/store/types"

import { AIDataBlockPart } from "./AIDataBlockPart"
import { AIMarkdownMessage } from "./AIMarkdownMessage"
import { AIRichTextMessage } from "./AIRichTextMessage"

interface UserMessagePartsProps {
  message: BizUIMessage
}

export const UserMessageParts: React.FC<UserMessagePartsProps> = React.memo(({ message }) => {
  return message.parts.map((part, index) => {
    const partKey = `${message.id}-${index}`

    switch (part.type) {
      case "text": {
        return <AIMarkdownMessage key={partKey} text={part.text} />
      }

      case "data-block": {
        return <AIDataBlockPart key={partKey} blocks={part.data as AIChatContextBlock[]} />
      }

      case "data-rich-text": {
        return (
          <AIRichTextMessage
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

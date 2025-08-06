import type { FC } from "react"

import { Focusable } from "~/components/common/Focusable"
import { HotkeyScope } from "~/constants"
import { ChatHeader } from "~/modules/ai-chat/components/layouts/ChatHeader"
import { ChatInterface } from "~/modules/ai-chat/components/layouts/ChatInterface"

export const AIChatLayout: FC<
  React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>
> = ({ ...props }) => {
  return (
    <Focusable
      scope={HotkeyScope.AIChat}
      className="bg-background relative flex h-full flex-col overflow-hidden"
      {...props}
    >
      <ChatHeader />
      <ChatInterface />
    </Focusable>
  )
}

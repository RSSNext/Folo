import { cn } from "@follow/utils"
import type { FC } from "react"

import { Focusable } from "~/components/common/Focusable"
import { HotkeyScope } from "~/constants"
import { ChatHeader } from "~/modules/ai-chat/components/layouts/ChatHeader"
import { ChatInterface } from "~/modules/ai-chat/components/layouts/ChatInterface"

export interface AIChatFixedPanelProps
  extends React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement> {}

export const AIChatFixedPanel: FC<AIChatFixedPanelProps> = ({ className, ...props }) => {
  return (
    <Focusable
      scope={HotkeyScope.AIChat}
      className={cn("bg-background relative flex h-full flex-col overflow-hidden", className)}
      {...props}
    >
      <ChatHeader />
      <ChatInterface />
    </Focusable>
  )
}

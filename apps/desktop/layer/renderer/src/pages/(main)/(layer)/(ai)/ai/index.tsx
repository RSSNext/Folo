import { cn } from "@follow/utils"

import { AIChatRoot } from "~/modules/ai-chat/components/layouts/AIChatRoot"
import { ChatPageHeader } from "~/modules/ai-chat/components/layouts/ChatHeader"
import { ChatInterface } from "~/modules/ai-chat/components/layouts/ChatInterface"

export const Component = () => {
  return (
    <div
      className={cn(
        "relative flex h-screen w-full flex-col",
        "[&_[data-testid=chat-input-container]]:translate-y-32 [&_[data-testid=welcome-screen-header]]:-translate-y-24",
      )}
      style={{ "--ai-chat-layout-width": "65rem" } as React.CSSProperties}
    >
      <AIChatRoot>
        <ChatPageHeader />
        <ChatInterface centerInputOnEmpty />
      </AIChatRoot>
    </div>
  )
}

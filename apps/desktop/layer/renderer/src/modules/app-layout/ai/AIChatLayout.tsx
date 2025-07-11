import { Focusable } from "~/components/common/Focusable"
import { HotkeyScope } from "~/constants"
import { AIChatRoot } from "~/modules/ai/chat/components/AIChatRoot"

import { ChatHeader } from "./components/ChatHeader"
import { ChatInterface } from "./components/ChatInterface"

export const AIChatLayout = () => {
  return (
    <AIChatRoot wrapFocusable={false}>
      <Focusable
        scope={HotkeyScope.AIChat}
        className="bg-background relative flex size-full flex-col overflow-hidden"
      >
        <ChatHeader />
        <ChatInterface />
      </Focusable>
    </AIChatRoot>
  )
}

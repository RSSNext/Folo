import { Focusable } from "~/components/common/Focusable"
import { HotkeyScope } from "~/constants"
import { AIChatRoot } from "~/modules/ai/chat/components/AIChatRoot"

import { ChatHeader } from "./components/ChatHeader"
import { ChatInterface } from "./components/ChatInterface"

export const AIChatLayout = ({ style }: { style?: React.CSSProperties }) => {
  return (
    <AIChatRoot wrapFocusable={false}>
      <Focusable
        scope={HotkeyScope.AIChat}
        className="bg-background relative flex h-full flex-col overflow-hidden"
        style={style}
      >
        <ChatHeader />
        <ChatInterface />
      </Focusable>
    </AIChatRoot>
  )
}

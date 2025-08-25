import { AIChatRoot } from "~/modules/ai-chat/components/layouts/AIChatRoot"
import { ChatPageHeader } from "~/modules/ai-chat/components/layouts/ChatHeader"
import { ChatInterface } from "~/modules/ai-chat/components/layouts/ChatInterface"

export const Component = () => {
  return (
    <div className="relative flex h-screen w-full flex-col">
      <AIChatRoot>
        <ChatPageHeader />
        <ChatInterface centerInputOnEmpty />
      </AIChatRoot>
    </div>
  )
}

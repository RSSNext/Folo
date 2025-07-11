import { use } from "react"

import { AIChatContext } from "~/modules/ai/chat/__internal__/AIChatContext"
import { AIChatContextBar } from "~/modules/ai/chat/components/AIChatContextBar"

export const AIChatBottom: React.FC<{ children: React.ReactNode }> = (props) => {
  return (
    <div className="bg-background relative overflow-hidden">
      <AIChatErrorIndicator />

      {/* Context Bar */}
      <div className="border-border border-b">
        <AIChatContextBar />
      </div>

      {props.children}
    </div>
  )
}

const AIChatErrorIndicator = () => {
  const { error } = use(AIChatContext)

  if (!error) return null

  return (
    <div className="bg-red/50 max-h-12 w-full px-2 py-1 text-[12px]">
      <div className="line-clamp-2 text-white">{error.message}</div>
    </div>
  )
}

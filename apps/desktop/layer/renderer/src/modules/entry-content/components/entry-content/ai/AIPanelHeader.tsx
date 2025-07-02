import * as React from "react"

import { setAIChatPinned, useAIChatPinned } from "~/atoms/settings/ai"
import { setTimelineColumnShow } from "~/atoms/sidebar"
import { AIChatContext } from "~/modules/ai/chat/__internal__/AIChatContext"

export const AIPanelHeader: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { setMessages } = React.use(AIChatContext)
  const isAiChatPinned = useAIChatPinned()
  return (
    <div className="border-border flex h-[55px] shrink-0 items-center justify-between border-b px-3">
      <div className="flex items-center gap-3">
        <div className="from-accent flex size-8 items-center justify-center rounded-full bg-gradient-to-br to-red-500">
          <i className="i-mgc-ai-cute-re size-4 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">{APP_NAME} AI</h3>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="hover:bg-fill-secondary flex size-8 items-center justify-center rounded-full transition-colors"
          onClick={() => setMessages([])}
        >
          <i className="i-mgc-add-cute-re size-4" />
        </button>
        {!isAiChatPinned && (
          <button
            type="button"
            className="hover:bg-fill-secondary flex size-8 items-center justify-center rounded-full transition-colors"
            onClick={() => {
              if (window.innerWidth < 1440) {
                setTimelineColumnShow(false)
              }
              setAIChatPinned(true)
              onClose()
            }}
          >
            <i className="i-mingcute-pin-line size-4" />
          </button>
        )}
        <button
          type="button"
          className="bg-fill-tertiary hover:bg-fill-secondary flex size-8 items-center justify-center rounded-full transition-colors"
          onClick={onClose}
        >
          <i className="i-mgc-close-cute-re size-4" />
        </button>
      </div>
    </div>
  )
}

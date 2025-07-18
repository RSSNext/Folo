import { ActionButton } from "@follow/components/ui/button/action-button.js"
import * as React from "react"
import { useTranslation } from "react-i18next"

import { setAIChatPinned, useAIChatPinned } from "~/atoms/settings/ai"
import { useDialog } from "~/components/ui/modal/stacked/hooks"
import { AIChatContext } from "~/modules/ai/chat/__internal__/AIChatContext"

export const AIPanelHeader: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { setMessages, messages } = React.use(AIChatContext)
  const isAiChatPinned = useAIChatPinned()
  const { ask } = useDialog()
  const { t } = useTranslation("ai")
  return (
    <div className="border-border flex h-[55px] shrink-0 items-center justify-between border-b px-3">
      <div className="flex items-center gap-3">
        <div className="from-folo flex size-8 items-center justify-center rounded-full bg-gradient-to-br to-red-500">
          <i className="i-mgc-ai-cute-fi size-4 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">{APP_NAME} AI</h3>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <ActionButton
          icon={<i className="i-mgc-add-cute-re size-4" />}
          onClick={() => {
            if (messages.length === 0) {
              return
            }

            ask({
              title: t("clear_chat"),
              message: t("clear_chat_message"),
              variant: "danger",
              onConfirm: () => {
                setMessages([])
              },
            })
          }}
        />
        {!isAiChatPinned && (
          <ActionButton
            icon={<i className="i-mingcute-pin-line size-4" />}
            onClick={() => {
              setAIChatPinned(true)
              onClose()
            }}
          />
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

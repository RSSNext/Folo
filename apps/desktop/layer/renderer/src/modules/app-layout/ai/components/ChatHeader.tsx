import { ActionButton } from "@follow/components/ui/button/index.js"
import { use, useCallback } from "react"
import { useTranslation } from "react-i18next"

import { useDialog } from "~/components/ui/modal/stacked/hooks"
import {
  AIChatContext,
  useAIChatSessionMethods,
} from "~/modules/ai/chat/__internal__/AIChatContext"
import { useSessionState } from "~/modules/ai/chat/atoms/session"
import { useSettingModal } from "~/modules/settings/modal/use-setting-modal-hack"

import { ChatMoreDropdown } from "./ChatMoreDropdown"

export const ChatHeader = () => {
  const { currentTitle } = useSessionState()
  const { handleNewChat } = useAIChatSessionMethods()
  const settingModalPresent = useSettingModal()
  const { messages } = use(AIChatContext)

  const { ask } = useDialog()
  const { t } = useTranslation("ai")

  const handleNewChatClick = useCallback(() => {
    if (messages.length === 0) {
      return
    }

    ask({
      title: t("clear_chat"),
      message: t("clear_chat_message"),
      variant: "danger",
      onConfirm: () => {
        handleNewChat()
      },
    })
  }, [ask, messages.length, t, handleNewChat])

  const maskImage = `linear-gradient(to bottom, black 0%, black 75%, transparent 100%)`
  return (
    <div className="absolute inset-x-0 top-0 z-20 h-12">
      <div
        className="bg-background/70 backdrop-blur-background absolute inset-0"
        style={{
          maskImage,
          WebkitMaskImage: maskImage,
        }}
      />

      <div className="relative z-10 flex h-full items-center justify-between px-6">
        {/* Left side - Title */}
        <div className="mr-2 min-w-0 flex-1">
          {currentTitle && (
            <h1 key={currentTitle} className="text-text truncate font-medium">
              <span className="animate-mask-left-to-right [--animation-duration:1s]">
                {currentTitle}
              </span>
            </h1>
          )}
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2">
          <ActionButton tooltip="New Chat" onClick={handleNewChatClick}>
            <i className="i-mgc-add-cute-re size-5 opacity-80" />
          </ActionButton>

          <ActionButton tooltip="AI Settings" onClick={() => settingModalPresent("ai")}>
            <i className="i-mgc-user-setting-cute-re size-5 opacity-80" />
          </ActionButton>

          <ChatMoreDropdown />
        </div>
      </div>
    </div>
  )
}

import { ActionButton } from "@follow/components/ui/button/index.js"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"

import { useDialog } from "~/components/ui/modal/stacked/hooks"
import { useBlockActions, useChatActions, useCurrentTitle } from "~/modules/ai-chat/store/hooks"
import { useSettingModal } from "~/modules/settings/modal/use-setting-modal-hack"

import { ChatMoreDropdown } from "./ChatMoreDropdown"
import { EditableTitle } from "./EditableTitle"

export const ChatHeader = () => {
  const currentTitle = useCurrentTitle()

  const settingModalPresent = useSettingModal()
  const chatActions = useChatActions()
  const blockActions = useBlockActions()
  const { ask } = useDialog()
  const { t } = useTranslation("ai")

  const handleNewChatClick = useCallback(() => {
    const messages = chatActions.getMessages()
    if (messages.length === 0 && !currentTitle) {
      return
    }

    ask({
      title: t("clear_chat"),
      message: t("clear_chat_message"),
      variant: "danger",
      onConfirm: () => {
        chatActions.newChat()
        blockActions.clearBlocks()
      },
    })
  }, [chatActions, currentTitle, ask, t, blockActions])

  const handleTitleSave = useCallback(
    async (newTitle: string) => {
      await chatActions.editChatTitle(newTitle)
    },
    [chatActions],
  )

  const maskImage = `linear-gradient(to bottom, black 0%, black 75%, transparent 100%)`
  return (
    <div className="absolute inset-x-0 top-0 z-[1] h-12">
      <div
        className="bg-background/70 backdrop-blur-background absolute inset-0"
        style={{
          maskImage,
          WebkitMaskImage: maskImage,
        }}
      />

      <div className="relative z-10 flex h-full items-center justify-between px-4">
        {/* Left side - Title */}
        <div className="mr-2 min-w-0 flex-1">
          <EditableTitle
            title={currentTitle}
            onSave={handleTitleSave}
            placeholder="Untitled Chat"
          />
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2">
          <ActionButton tooltip="New Chat" onClick={handleNewChatClick}>
            <i className="i-mgc-add-cute-re text-text-secondary size-5" />
          </ActionButton>

          <ActionButton tooltip="AI Settings" onClick={() => settingModalPresent("ai")}>
            <i className="i-mgc-user-setting-cute-re text-text-secondary size-5" />
          </ActionButton>

          <ChatMoreDropdown />
        </div>
      </div>
    </div>
  )
}

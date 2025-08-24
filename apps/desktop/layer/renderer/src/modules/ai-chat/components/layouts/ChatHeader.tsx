import { ActionButton } from "@follow/components/ui/button/index.js"
import { useCallback } from "react"

import { AIChatPanelStyle, setAIPanelVisibility, useAIChatPanelStyle } from "~/atoms/settings/ai"
import { GlassButton } from "~/components/ui/button/GlassButton"
import { useBlockActions, useChatActions, useCurrentTitle } from "~/modules/ai-chat/store/hooks"
import { useSettingModal } from "~/modules/settings/modal/use-setting-modal-hack"

import { ChatMoreDropdown } from "./ChatMoreDropdown"
import { EditableTitle } from "./EditableTitle"

export const ChatHeader = () => {
  const currentTitle = useCurrentTitle()

  const settingModalPresent = useSettingModal()
  const chatActions = useChatActions()
  const blockActions = useBlockActions()

  const handleNewChatClick = useCallback(() => {
    const messages = chatActions.getMessages()
    if (messages.length === 0 && !currentTitle) {
      return
    }

    chatActions.newChat()
    blockActions.clearBlocks({ keepSpecialTypes: true })
  }, [chatActions, currentTitle, blockActions])

  const handleTitleSave = useCallback(
    async (newTitle: string) => {
      await chatActions.editChatTitle(newTitle)
    },
    [chatActions],
  )

  const panelStyle = useAIChatPanelStyle()
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
        <div className="mr-2 flex min-w-0 flex-1 items-center">
          <EditableTitle title={currentTitle} onSave={handleTitleSave} placeholder="New Chat" />
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2">
          <ActionButton tooltip="New Chat" onClick={handleNewChatClick}>
            <i className="i-mgc-add-cute-re text-text-secondary size-5" />
          </ActionButton>

          <ActionButton tooltip="AI Settings" onClick={() => settingModalPresent("ai")}>
            <i className="i-mgc-user-setting-cute-re text-text-secondary size-5" />
          </ActionButton>

          <ChatMoreDropdown
            triggerElement={
              <ActionButton tooltip="More">
                <i className="i-mingcute-more-1-fill size-5 opacity-80" />
              </ActionButton>
            }
          />

          {panelStyle === AIChatPanelStyle.Floating && (
            <>
              <div className="bg-border h-5 w-px" />
              <ActionButton tooltip="Close" onClick={() => setAIPanelVisibility(false)}>
                <i className="i-mgc-close-cute-re text-text-secondary size-5" />
              </ActionButton>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export const ChatPageHeader = () => {
  const currentTitle = useCurrentTitle()

  const settingModalPresent = useSettingModal()
  const chatActions = useChatActions()
  const blockActions = useBlockActions()

  const handleNewChatClick = useCallback(() => {
    const messages = chatActions.getMessages()
    if (messages.length === 0 && !currentTitle) {
      return
    }

    chatActions.newChat()
    blockActions.clearBlocks({ keepSpecialTypes: true })
  }, [chatActions, currentTitle, blockActions])

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
        <div className="mr-2 flex min-w-0 flex-1 items-center">
          <EditableTitle title={currentTitle} onSave={handleTitleSave} placeholder="New Chat" />
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2">
          <GlassButton description="New Chat" size="sm" onClick={handleNewChatClick}>
            <i className="i-mgc-add-cute-re text-text-secondary size-4" />
          </GlassButton>

          <GlassButton
            description="AI Settings"
            size="sm"
            onClick={() => settingModalPresent("ai")}
          >
            <i className="i-mgc-user-setting-cute-re text-text-secondary size-4" />
          </GlassButton>

          <div className="bg-border mx-2 h-5 w-px" />
          <ChatMoreDropdown
            asChild={false}
            triggerElement={
              <GlassButton description="More" size="sm">
                <i className="i-mingcute-more-1-fill size-4 opacity-80" />
              </GlassButton>
            }
          />
        </div>
      </div>
    </div>
  )
}

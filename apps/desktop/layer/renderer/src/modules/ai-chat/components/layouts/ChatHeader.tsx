import { ActionButton } from "@follow/components/ui/button/index.js"
import { cn } from "@follow/utils"
import { useAtomValue } from "jotai"
import type { ReactNode } from "react"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"

import { AIChatPanelStyle, setAIPanelVisibility, useAIChatPanelStyle } from "~/atoms/settings/ai"
import { useBlockActions, useChatActions, useCurrentTitle } from "~/modules/ai-chat/store/hooks"

import { useAIRootState } from "../../store/AIChatContext"
import { ChatMoreDropdown } from "./ChatMoreDropdown"
import { EditableTitle } from "./EditableTitle"
import { TaskReportDropdown } from "./TaskReportDropdown"

// Base header layout with shared logic inside
const ChatHeaderLayout = ({
  renderActions,
}: {
  renderActions: (ctx: {
    onNewChatClick: () => void
    currentTitle: string | undefined
    onSaveTitle: (newTitle: string) => Promise<void>
  }) => ReactNode
}) => {
  const currentTitle = useCurrentTitle()
  const chatActions = useChatActions()
  const blockActions = useBlockActions()

  const handleNewChatClick = useCallback(() => {
    const messages = chatActions.getMessages()

    if (messages.length === 0) {
      return
    }

    chatActions.newChat()
    blockActions.clearBlocks({ keepSpecialTypes: true })
  }, [chatActions, blockActions])

  const handleTitleSave = useCallback(
    async (newTitle: string) => {
      await chatActions.editChatTitle(newTitle)
    },
    [chatActions],
  )

  const isFloating = useAIChatPanelStyle() === AIChatPanelStyle.Floating

  const { isScrolledBeyondThreshold } = useAIRootState()
  const isScrolledBeyondThresholdValue = useAtomValue(isScrolledBeyondThreshold)

  const { t } = useTranslation("ai")
  return (
    <div
      className={cn(
        "absolute inset-x-0 top-0 z-[1] duration-200",
        !isFloating && "bg-background data-[scrolled-beyond-threshold=true]:border-b",
      )}
      data-scrolled-beyond-threshold={isScrolledBeyondThresholdValue}
    >
      <div className="h-entry-header">
        {isFloating && (
          <div
            className="bg-background/70 backdrop-blur-background absolute inset-0"
            style={{
              maskImage: `linear-gradient(to bottom, black 0%, black 90%, transparent 100%)`,
            }}
          />
        )}

        <div className="relative z-10 flex h-full items-center justify-between px-4">
          <div className="mr-2 flex min-w-0 flex-1 items-center">
            <EditableTitle
              title={currentTitle}
              onSave={handleTitleSave}
              placeholder={t("common.new_chat")}
            />
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center gap-2">
            {renderActions({
              onNewChatClick: handleNewChatClick,
              currentTitle,
              onSaveTitle: handleTitleSave,
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export const ChatHeader = () => {
  const panelStyle = useAIChatPanelStyle()
  const { t } = useTranslation("ai")

  return (
    <ChatHeaderLayout
      renderActions={({ onNewChatClick }) => (
        <>
          <ActionButton tooltip={t("common.new_chat")} onClick={onNewChatClick}>
            <i className="i-mgc-add-cute-re text-text-secondary size-5" />
          </ActionButton>

          <TaskReportDropdown />

          <ChatMoreDropdown
            triggerElement={
              <ActionButton tooltip="More">
                <i className="i-mingcute-more-1-fill text-text-secondary size-5" />
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
        </>
      )}
    />
  )
}

export const ChatPageHeader = () => {
  const { t } = useTranslation("ai")

  return (
    <ChatHeaderLayout
      renderActions={({ onNewChatClick }) => (
        <>
          <ActionButton tooltip={t("common.new_chat")} onClick={onNewChatClick}>
            <i className="i-mgc-add-cute-re text-text-secondary size-5" />
          </ActionButton>

          <TaskReportDropdown />

          <div className="bg-border mx-2 h-5 w-px" />
          <ChatMoreDropdown
            canToggleMode={false}
            triggerElement={
              <ActionButton tooltip="More">
                <i className="i-mingcute-more-1-fill text-text-secondary size-5" />
              </ActionButton>
            }
          />
        </>
      )}
    />
  )
}

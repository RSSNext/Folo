import { ActionButton } from "@follow/components/ui/button/index.js"
import { cn } from "@follow/utils"
import { useAtomValue } from "jotai"
import type { ReactNode } from "react"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"

import { AIChatPanelStyle, setAIPanelVisibility, useAIChatPanelStyle } from "~/atoms/settings/ai"
import { useTimelineSummaryAutoContext } from "~/modules/ai-chat/hooks/useTimelineSummaryAutoContext"
import {
  useBlockActions,
  useChatActions,
  useCurrentTitle,
  useHasMessages,
} from "~/modules/ai-chat/store/hooks"
import { useSettingModal } from "~/modules/settings/modal/use-setting-modal-hack"

import { useAIRootState } from "../../store/AIChatContext"
import { AISpline } from "../3d-models/AISpline"
import { ChatHistoryDropdown } from "./ChatHistoryDropdown"
import { ChatMoreDropdown } from "./ChatMoreDropdown"
import { AIHeaderTitle } from "./ChatTitle"
import { TaskReportDropdown } from "./TaskReportDropdown"

// Base header layout with shared logic inside
const ChatHeaderLayout = ({
  renderActions,
}: {
  renderActions: (ctx: {
    onNewChatClick: () => void
    currentTitle: string | undefined
    displayTitle: string | undefined
  }) => ReactNode
}) => {
  const hasMessages = useHasMessages()
  const currentTitle = useCurrentTitle()
  const chatActions = useChatActions()
  const blockActions = useBlockActions()
  const { t } = useTranslation("ai")
  const shouldDisableTimelineSummary = useTimelineSummaryAutoContext()
  const settingModalPresent = useSettingModal()

  const displayTitle = currentTitle

  const handleNewChatClick = useCallback(() => {
    const messages = chatActions.getMessages()

    if (messages.length === 0) {
      return
    }

    if (shouldDisableTimelineSummary) {
      chatActions.setTimelineSummaryManualOverride(true)
    }

    chatActions.newChat()
    blockActions.clearBlocks({ keepSpecialTypes: true })
  }, [chatActions, blockActions, shouldDisableTimelineSummary])

  const isFloating = useAIChatPanelStyle() === AIChatPanelStyle.Floating

  const { isScrolledBeyondThreshold } = useAIRootState()
  const isScrolledBeyondThresholdValue = useAtomValue(isScrolledBeyondThreshold)

  return (
    <div
      className={cn(
        "absolute inset-x-0 top-0 z-[1] border-b border-transparent duration-200",
        !isFloating && "bg-background data-[scrolled-beyond-threshold=true]:border-b-border",
      )}
      data-scrolled-beyond-threshold={isScrolledBeyondThresholdValue}
    >
      <div className="h-top-header">
        {isFloating && (
          <div
            className="absolute inset-0 bg-background/70 backdrop-blur-background"
            style={{
              maskImage: `linear-gradient(to bottom, black 0%, black 90%, transparent 100%)`,
            }}
          />
        )}

        <div className="relative z-10 flex h-full items-center justify-between px-4">
          <div className="mr-2 flex min-w-0 items-center">
            {(hasMessages || currentTitle) && (
              <div onClick={() => settingModalPresent("ai")}>
                <AISpline className="no-drag-region -mx-1 -mb-1 mr-1 size-9" />
              </div>
            )}
            <ChatHistoryDropdown
              triggerElement={
                <AIHeaderTitle title={displayTitle} placeholder={t("common.new_chat")} />
              }
            />
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center gap-2">
            {renderActions({
              onNewChatClick: handleNewChatClick,
              currentTitle,
              displayTitle,
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
            <i className="i-mgc-edit-cute-re size-5 text-text-secondary" />
          </ActionButton>

          <TaskReportDropdown />

          <ChatMoreDropdown
            triggerElement={
              <ActionButton tooltip="More">
                <i className="i-mingcute-more-1-fill size-5 text-text-secondary" />
              </ActionButton>
            }
          />

          {panelStyle === AIChatPanelStyle.Floating && (
            <>
              <div className="h-5 w-px bg-border" />
              <ActionButton tooltip="Close" onClick={() => setAIPanelVisibility(false)}>
                <i className="i-mgc-close-cute-re size-5 text-text-secondary" />
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
            <i className="i-mgc-edit-cute-re size-5 text-text-secondary" />
          </ActionButton>

          <TaskReportDropdown />

          <div className="mx-2 h-5 w-px bg-border" />
          <ChatMoreDropdown
            canToggleMode={false}
            triggerElement={
              <ActionButton tooltip="More">
                <i className="i-mingcute-more-1-fill size-5 text-text-secondary" />
              </ActionButton>
            }
          />
        </>
      )}
    />
  )
}

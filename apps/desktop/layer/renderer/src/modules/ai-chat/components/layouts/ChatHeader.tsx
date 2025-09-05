import { ActionButton } from "@follow/components/ui/button/index.js"
import type { ReactNode } from "react"
import { useCallback } from "react"

import { AIChatPanelStyle, setAIPanelVisibility, useAIChatPanelStyle } from "~/atoms/settings/ai"
import { GlassButton } from "~/components/ui/button/GlassButton"
import { useBlockActions, useChatActions, useCurrentTitle } from "~/modules/ai-chat/store/hooks"

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

  const maskImage = `linear-gradient(to bottom, black 0%, black 90%, transparent 100%)`
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
          {renderActions({
            onNewChatClick: handleNewChatClick,
            currentTitle,
            onSaveTitle: handleTitleSave,
          })}
        </div>
      </div>
    </div>
  )
}

export const ChatHeader = () => {
  const panelStyle = useAIChatPanelStyle()

  return (
    <ChatHeaderLayout
      renderActions={({ onNewChatClick }) => (
        <>
          <ActionButton tooltip="New Chat" onClick={onNewChatClick}>
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
  return (
    <ChatHeaderLayout
      renderActions={({ onNewChatClick }) => (
        <>
          <GlassButton description="New Chat" size="sm" onClick={onNewChatClick}>
            <i className="i-mgc-add-cute-re text-text-secondary size-4" />
          </GlassButton>

          <TaskReportDropdown
            asChild={false}
            triggerElement={
              <GlassButton description="Task Reports" size="sm">
                <i className="i-mgc-inbox-cute-re text-text-secondary size-4" />
              </GlassButton>
            }
          />

          <div className="bg-border mx-2 h-5 w-px" />
          <ChatMoreDropdown
            canToggleMode={false}
            asChild={false}
            triggerElement={
              <GlassButton description="More" size="sm">
                <i className="i-mingcute-more-1-fill size-4 opacity-80" />
              </GlassButton>
            }
          />
        </>
      )}
    />
  )
}

import { ActionButton } from "@follow/components/ui/button/index.js"
import { nextFrame } from "@follow/utils"
import type { ReactElement } from "react"
import { useMemo, useState } from "react"
import { toast } from "sonner"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu/dropdown-menu"
import { useModalStack } from "~/components/ui/modal/stacked/hooks"
import { useAIChatSessionListQuery } from "~/modules/ai-chat-session/query"
import { AITaskModal, useAITaskListQuery, useCanCreateNewAITask } from "~/modules/ai-task"
import { useSettingModal } from "~/modules/settings/modal/use-setting-modal-hack"
import { AI_SETTING_SECTION_IDS } from "~/modules/settings/tabs/ai"

import {
  EmptyState,
  isTaskSession,
  isUnreadSession,
  SessionItem,
  useChatSessionHandlers,
} from "./shared"

interface TaskReportDropdownProps {
  triggerElement?: ReactElement
  asChild?: boolean
}

export const TaskReportDropdown = ({ triggerElement, asChild = true }: TaskReportDropdownProps) => {
  const tasks = useAITaskListQuery()
  const sessions = useAIChatSessionListQuery({
    refetchInterval: tasks?.length ? 1 * 60 * 1000 : false, // 1 minute
  })
  const [loadingChatId, setLoadingChatId] = useState<string | null>(null)
  const showSettings = useSettingModal()

  // Only keep task sessions for display
  const taskSessions = useMemo(() => (sessions || []).filter((s) => isTaskSession(s)), [sessions])
  const hasTaskSessions = taskSessions.length > 0
  const hasUnreadSessions = useMemo(
    () => taskSessions.some((s) => isUnreadSession(s)),
    [taskSessions],
  )

  // Call all hooks at the top level, never conditionally
  const { present } = useModalStack()
  const canCreateNewTask = useCanCreateNewAITask()
  const { handleSessionSelect, handleDeleteSession } = useChatSessionHandlers({
    sessions: taskSessions,
  })

  // If no unread sessions, don't render the button (only when no custom trigger)
  if (!hasUnreadSessions && !triggerElement) {
    return null
  }

  const handleScheduleActionClick = () => {
    if (!canCreateNewTask) {
      toast.error("Please remove an existing task before creating a new one.")
      return
    }
    showSettings({ tab: "ai", section: AI_SETTING_SECTION_IDS.tasks })
    nextFrame(() => {
      present({
        title: "New AI Task",
        canClose: true,
        content: () => <AITaskModal showSettingsTip />,
      })
    })
  }

  const defaultTrigger = (
    <ActionButton tooltip="Task Reports" className="relative">
      <i className="i-mgc-calendar-time-add-cute-re size-5 text-text-secondary" />
      {hasUnreadSessions && (
        <span
          className="absolute right-1 top-1 block size-2 rounded-full bg-accent shadow-[0_0_0_2px_var(--color-bg-default)] dark:shadow-[0_0_0_2px_var(--color-bg-default)]"
          aria-label="Unread task reports"
        />
      )}
    </ActionButton>
  )

  return (
    <DropdownMenu>
      {asChild ? (
        <DropdownMenuTrigger asChild={asChild}>
          {triggerElement || defaultTrigger}
        </DropdownMenuTrigger>
      ) : (
        <DropdownMenuTrigger className="relative">
          {triggerElement || defaultTrigger}
          {hasTaskSessions && triggerElement && (
            <span
              className="absolute right-1 top-1 block size-2 rounded-full bg-accent shadow-[0_0_0_2px_var(--color-bg-default)] dark:shadow-[0_0_0_2px_var(--color-bg-default)]"
              aria-label="Unread task reports"
            />
          )}
        </DropdownMenuTrigger>
      )}

      <DropdownMenuContent align="end" className="w-80">
        {taskSessions.length > 0 ? (
          taskSessions.map((session) => (
            <SessionItem
              key={session.chatId}
              session={session}
              onClick={() => handleSessionSelect(session)}
              onDelete={(e) => {
                handleDeleteSession(session.chatId, {
                  event: e,
                  onBeforeDelete: () => setLoadingChatId(session.chatId),
                }).finally(() => {
                  setLoadingChatId(null)
                })
              }}
              isLoading={loadingChatId === session.chatId}
              hasUnread={hasUnreadSessions}
            />
          ))
        ) : (
          <EmptyState
            message="No unread task reports"
            icon={
              <i className="i-mgc-calendar-time-add-cute-re mb-2 block size-8 text-text-secondary" />
            }
          />
        )}

        {canCreateNewTask && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleScheduleActionClick}>
              <i className="i-mgc-add-cute-re mr-2 size-4" />
              New Task
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

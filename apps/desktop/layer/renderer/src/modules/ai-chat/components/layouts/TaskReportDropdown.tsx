import { ActionButton } from "@follow/components/ui/button/index.js"
import { nextFrame } from "@follow/utils"
import type { AIChatSession } from "@follow-app/client-sdk"
import type { ReactElement } from "react"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { RelativeDay } from "~/components/ui/datetime"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu/dropdown-menu"
import { useDialog, useModalStack } from "~/components/ui/modal/stacked/hooks"
import { useTimelineSummaryAutoContext } from "~/modules/ai-chat/hooks/useTimelineSummaryAutoContext"
import { useChatActions, useCurrentChatId } from "~/modules/ai-chat/store/hooks"
import { AIChatSessionService } from "~/modules/ai-chat-session"
import {
  useAIChatSessionListQuery,
  useDeleteAIChatSessionMutation,
  useMarkChatSessionSeenMutation,
} from "~/modules/ai-chat-session/query"
import { AITaskModal, useCanCreateNewAITask } from "~/modules/ai-task"
import { useSettingModal } from "~/modules/settings/modal/use-setting-modal-hack"
import { AI_SETTING_SECTION_IDS } from "~/modules/settings/tabs/ai"

import { AIPersistService } from "../../services"

interface TaskReportDropdownProps {
  triggerElement?: ReactElement
  asChild?: boolean
}

interface SessionItemProps {
  session: AIChatSession
  onClick?: () => void
  onDelete?: (e: React.MouseEvent) => void
  isLoading?: boolean
}

const isTaskSession = (session: AIChatSession): boolean => {
  if (!session.lastSeenAt || !session.updatedAt) return false
  if (!session.chatId.startsWith("ai-task")) return false
  return true
}

// Helper to determine if a session has unread messages
const isUnreadSession = (session: AIChatSession): boolean => {
  return new Date(session.updatedAt) > new Date(session.lastSeenAt)
}
const SessionItem = ({ session, onClick, onDelete, isLoading }: SessionItemProps) => {
  const hasUnreadMessages = isUnreadSession(session)
  return (
    <DropdownMenuItem
      onClick={onClick}
      className={`group relative ${onClick ? "cursor-pointer" : "cursor-default"}`}
    >
      <div className="ml-1 flex min-w-0 flex-1 justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {hasUnreadMessages && (
            <span
              className="absolute left-0 block size-2 shrink-0 rounded-full bg-accent"
              aria-label="Unread"
              role="status"
            />
          )}
          <p className="mb-0.5 truncate font-medium">{session.title || "Untitled Chat"}</p>
        </div>
        <div className="relative flex min-w-0 items-center">
          <p className="ml-2 shrink-0 truncate text-xs text-text-secondary">
            <RelativeDay date={new Date(session.updatedAt)} />
          </p>
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="absolute inset-y-0 right-0 flex items-center bg-accent px-2 py-1 text-white opacity-0 shadow-lg backdrop-blur-sm group-data-[highlighted]:text-white group-data-[highlighted]:opacity-100"
              disabled={isLoading}
            >
              {isLoading ? (
                <i className="i-mgc-loading-3-cute-re size-4 animate-spin" />
              ) : (
                <i className="i-mgc-delete-2-cute-re size-4" />
              )}
            </button>
          )}
        </div>
      </div>
    </DropdownMenuItem>
  )
}

const EmptyState = () => {
  return (
    <div className="flex flex-col items-center py-8 text-center">
      <i className="i-mgc-calendar-time-add-cute-re mb-2 block size-8 text-text-secondary" />
      <p className="text-sm text-text-secondary">No unread task reports</p>
    </div>
  )
}

export const TaskReportDropdown = ({ triggerElement, asChild = true }: TaskReportDropdownProps) => {
  const sessions = useAIChatSessionListQuery()
  const currentChatId = useCurrentChatId()
  const chatActions = useChatActions()
  const shouldDisableTimelineSummary = useTimelineSummaryAutoContext()
  const deleteSessionMutation = useDeleteAIChatSessionMutation()
  const { ask } = useDialog()
  const { t } = useTranslation("ai")
  const [loadingChatId, setLoadingChatId] = useState<string | null>(null)
  const showSettings = useSettingModal()
  const markChatSessionSeenMutation = useMarkChatSessionSeenMutation()
  // Only keep task sessions for display
  const taskSessions = useMemo(() => (sessions || []).filter((s) => isTaskSession(s)), [sessions])
  const hasTaskSessions = taskSessions.length > 0
  const hasUnreadSessions = useMemo(
    () => taskSessions.some((s) => isUnreadSession(s)),
    [taskSessions],
  )

  const { present } = useModalStack()
  const canCreateNewTask = useCanCreateNewAITask()
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

  const handleSessionSelect = useCallback(
    async (session: AIChatSession) => {
      if (session.chatId === currentChatId) {
        console.warn("Session already active, no action taken")
        return
      }
      try {
        await AIChatSessionService.fetchAndPersistMessages(session)
      } catch (e) {
        console.error("Failed to sync chat session messages:", e)
        toast.error("Failed to load chat messages")
      }
      if (shouldDisableTimelineSummary) {
        chatActions.setTimelineSummaryManualOverride(true)
      }
      chatActions.switchToChat(session.chatId)
      if (isUnreadSession(session)) {
        markChatSessionSeenMutation.mutate({
          chatId: session.chatId,
          lastSeenAt: new Date().toISOString(),
        })
      }
    },
    [chatActions, currentChatId, markChatSessionSeenMutation, shouldDisableTimelineSummary],
  )

  const handleDeleteSession = useCallback(
    async (chatId: string, e: React.MouseEvent) => {
      e.stopPropagation()
      e.preventDefault()

      const session = sessions?.find((s) => s.chatId === chatId)
      if (!session) return

      const confirm = await ask({
        title: t("delete_chat"),
        message: t("delete_chat_message", { title: session.title || "Untitled Chat" }),
        variant: "danger",
      })

      if (!confirm) return

      setLoadingChatId(chatId)
      try {
        await Promise.all([
          deleteSessionMutation.mutateAsync({ chatId }),
          AIPersistService.deleteSession(chatId),
        ])
        toast.success(t("delete_chat_success"))

        if (chatId === currentChatId) {
          if (shouldDisableTimelineSummary) {
            chatActions.setTimelineSummaryManualOverride(true)
          }
          chatActions.newChat()
        }
      } catch (error) {
        console.error("Failed to delete session:", error)
        toast.error(t("delete_chat_error"))
      } finally {
        setLoadingChatId(null)
      }
    },
    [
      sessions,
      ask,
      t,
      currentChatId,
      chatActions,
      deleteSessionMutation,
      shouldDisableTimelineSummary,
    ],
  )

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
              onDelete={(e) => handleDeleteSession(session.chatId, e)}
              isLoading={loadingChatId === session.chatId}
            />
          ))
        ) : (
          <EmptyState />
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

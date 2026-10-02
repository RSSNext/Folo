import { ActionButton } from "@follow/components/ui/button/index.js"
import { SegmentGroup, SegmentItem } from "@follow/components/ui/segment/index.js"
import { nextFrame } from "@follow/utils"
import type { ReactNode } from "react"
import { startTransition, useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu/dropdown-menu"
import { useModalStack } from "~/components/ui/modal/stacked/hooks"
import { useChatHistory } from "~/modules/ai-chat/hooks/useChatHistory"
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

interface ChatHistoryDropdownProps {
  triggerElement?: ReactNode
  asChild?: boolean
}

export const ChatHistoryDropdown = ({
  triggerElement,
  asChild = true,
}: ChatHistoryDropdownProps) => {
  const { t } = useTranslation("ai")
  const [loadingChatId, setLoadingChatId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("chats")
  const { sessions, loading, loadHistory } = useChatHistory()

  // Task session related hooks
  const tasks = useAITaskListQuery()
  const taskSessions = useAIChatSessionListQuery({
    refetchInterval: tasks?.length ? 1 * 60 * 1000 : false,
  })
  const { present } = useModalStack()
  const canCreateNewTask = useCanCreateNewAITask()
  const showSettings = useSettingModal()

  // Merge both session types
  const allSessions = useMemo(() => {
    const regularSessions = sessions || []
    const aiTaskSessions = taskSessions || []
    return [...regularSessions, ...aiTaskSessions]
  }, [sessions, taskSessions])

  // Filter sessions by type
  const regularSessions = useMemo(() => {
    return (sessions || []).filter((s) => !isTaskSession(s))
  }, [sessions])

  const taskSessionsFiltered = useMemo(() => {
    return (taskSessions || []).filter((s) => isTaskSession(s))
  }, [taskSessions])

  // Count unread sessions
  const hasUnreadRegularSessions = useMemo(() => {
    return regularSessions.some((s) => isUnreadSession(s))
  }, [regularSessions])

  const hasUnreadTaskSessions = useMemo(() => {
    return taskSessionsFiltered.some((s) => isUnreadSession(s))
  }, [taskSessionsFiltered])

  const handleScheduleActionClick = () => {
    if (!canCreateNewTask) {
      toast.error(t("tasks.toast.limit_reached"))
      return
    }
    showSettings({ tab: "ai", section: AI_SETTING_SECTION_IDS.tasks })
    nextFrame(() => {
      present({
        title: t("tasks.modal.new_title"),
        canClose: true,
        content: () => <AITaskModal showSettingsTip />,
      })
    })
  }

  const { handleSessionSelect, handleDeleteSession } = useChatSessionHandlers({
    sessions: allSessions,
  })

  const handleDropdownOpen = useCallback(
    (isOpen: boolean) => {
      if (isOpen) {
        startTransition(() => {
          loadHistory()
        })
      }
    },
    [loadHistory],
  )

  const defaultTrigger = (
    <ActionButton tooltip={t("chat.history.title")} className="relative">
      <i className="i-mgc-history-cute-re size-5 text-text-secondary" />
      {(hasUnreadRegularSessions || hasUnreadTaskSessions) && (
        <span
          className="absolute right-1 top-1 block size-2 rounded-full bg-accent shadow-[0_0_0_2px_var(--color-bg-default)] dark:shadow-[0_0_0_2px_var(--color-bg-default)]"
          aria-label={t("chat.history.unread_messages")}
        />
      )}
    </ActionButton>
  )

  return (
    <DropdownMenu onOpenChange={handleDropdownOpen}>
      <DropdownMenuTrigger asChild={asChild}>
        {triggerElement || defaultTrigger}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80">
        <SegmentGroup value={activeTab} onValueChanged={setActiveTab} className="mb-4 w-full">
          <SegmentItem
            value="chats"
            label={
              <span className="flex items-center gap-1">
                {t("chat.history.tabs.chats")}
                {hasUnreadRegularSessions && <span className="size-1.5 rounded-full bg-accent" />}
              </span>
            }
          />
          <SegmentItem
            value="tasks"
            label={
              <span className="flex items-center gap-1">
                {t("chat.history.tabs.tasks")}
                {hasUnreadTaskSessions && <span className="size-1.5 rounded-full bg-accent" />}
              </span>
            }
          />
        </SegmentGroup>

        <div className="max-h-80 overflow-y-auto">
          {activeTab === "chats" ? (
            loading && sessions.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <i className="i-mgc-loading-3-cute-re size-5 animate-spin text-text-secondary" />
              </div>
            ) : regularSessions.length > 0 ? (
              <>
                <div className="mb-1.5 px-2 py-1">
                  <p className="text-xs font-medium text-text-secondary">
                    {t("chat.history.recent")}
                  </p>
                </div>
                {regularSessions.map((session) => (
                  <SessionItem
                    key={session.chatId}
                    session={session}
                    onClick={() => handleSessionSelect(session)}
                    onDelete={(e) => {
                      handleDeleteSession(session.chatId, { event: e }).finally(() => {
                        setLoadingChatId(null)
                      })
                    }}
                    isLoading={loadingChatId === session.chatId}
                  />
                ))}
              </>
            ) : (
              <EmptyState message={t("chat.history.empty")} />
            )
          ) : taskSessionsFiltered.length > 0 ? (
            <>
              <div className="mb-1.5 px-2 py-1">
                <p className="text-xs font-medium text-text-secondary">
                  {t("chat.history.task_sessions")}
                </p>
              </div>
              {taskSessionsFiltered.map((session) => (
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
                  hasUnread={hasUnreadTaskSessions}
                />
              ))}
              {canCreateNewTask && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleScheduleActionClick}>
                    <i className="i-mgc-add-cute-re mr-2 size-4" />
                    {t("tasks.actions.new_task")}
                  </DropdownMenuItem>
                </>
              )}
            </>
          ) : (
            <EmptyState message={t("chat.history.task_sessions_empty")} />
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

import { ActionButton } from "@follow/components/ui/button/index.js"
import { SegmentGroup, SegmentItem } from "@follow/components/ui/segment/index.js"
import { nextFrame } from "@follow/utils"
import type { ReactNode } from "react"
import { startTransition, useCallback, useMemo, useState } from "react"
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
    <ActionButton tooltip="Chat History" className="relative">
      <i className="i-mgc-history-cute-re size-5 text-text-secondary" />
      {(hasUnreadRegularSessions || hasUnreadTaskSessions) && (
        <span
          className="absolute right-1 top-1 block size-2 rounded-full bg-accent shadow-[0_0_0_2px_var(--color-bg-default)] dark:shadow-[0_0_0_2px_var(--color-bg-default)]"
          aria-label="Unread messages"
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
                Chats
                {hasUnreadRegularSessions && <span className="size-1.5 rounded-full bg-accent" />}
              </span>
            }
          />
          <SegmentItem
            value="tasks"
            label={
              <span className="flex items-center gap-1">
                Tasks
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
                  <p className="text-xs font-medium text-text-secondary">Recent Chats</p>
                </div>
                {regularSessions.map((session) => (
                  <SessionItem
                    key={session.chatId}
                    session={session}
                    onClick={() => handleSessionSelect(session)}
                    onDelete={(e) => {
                      setLoadingChatId(session.chatId)
                      handleDeleteSession(session.chatId, e).finally(() => {
                        setLoadingChatId(null)
                      })
                    }}
                    isLoading={loadingChatId === session.chatId}
                  />
                ))}
              </>
            ) : (
              <EmptyState message="No chat history yet" />
            )
          ) : taskSessionsFiltered.length > 0 ? (
            <>
              <div className="mb-1.5 px-2 py-1">
                <p className="text-xs font-medium text-text-secondary">Task Sessions</p>
              </div>
              {taskSessionsFiltered.map((session) => (
                <SessionItem
                  key={session.chatId}
                  session={session}
                  onClick={() => handleSessionSelect(session)}
                  onDelete={(e) => {
                    setLoadingChatId(session.chatId)
                    handleDeleteSession(session.chatId, e).finally(() => {
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
                    New Task
                  </DropdownMenuItem>
                </>
              )}
            </>
          ) : (
            <EmptyState message="No task sessions yet" />
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

import { ActionButton } from "@follow/components/ui/button/index.js"
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
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu/dropdown-menu"
import { useDialog } from "~/components/ui/modal/stacked/hooks"
import { useChatActions, useCurrentChatId } from "~/modules/ai-chat/store/hooks"
import { AIChatSessionService } from "~/modules/ai-chat-session"
import {
  useAIChatSessionListQuery,
  useDeleteAIChatSessionMutation,
} from "~/modules/ai-chat-session/query"

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

// Helper to determine if a session has unread messages
const isSessionUnread = (session: AIChatSession): boolean => {
  if (!session.lastSeenAt || !session.updatedAt) return false
  return new Date(session.updatedAt) > new Date(session.lastSeenAt)
}

const SessionItem = ({ session, onClick, onDelete, isLoading }: SessionItemProps) => {
  return (
    <DropdownMenuItem
      onClick={onClick}
      className={`group relative ${onClick ? "cursor-pointer" : "cursor-default"}`}
    >
      <div className="flex min-w-0 flex-1 justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <p className="mb-0.5 truncate font-medium">{session.title || "Untitled Chat"}</p>
        </div>
        <div className="relative flex min-w-0 items-center">
          <p className="text-text-secondary ml-2 shrink-0 truncate text-xs">
            <RelativeDay date={new Date(session.createdAt)} />
          </p>
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="bg-accent absolute inset-y-0 right-0 flex items-center px-2 py-1 text-white opacity-0 shadow-lg backdrop-blur-sm group-data-[highlighted]:text-white group-data-[highlighted]:opacity-100"
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
      <i className="i-mgc-inbox-cute-re text-text-secondary mb-2 block size-8" />
      <p className="text-text-secondary text-sm">All task reports read</p>
    </div>
  )
}

export const TaskReportDropdown = ({ triggerElement, asChild = true }: TaskReportDropdownProps) => {
  const sessions = useAIChatSessionListQuery()
  const currentChatId = useCurrentChatId()
  const chatActions = useChatActions()
  const deleteSessionMutation = useDeleteAIChatSessionMutation()
  const { ask } = useDialog()
  const { t } = useTranslation("ai")
  const [loadingChatId, setLoadingChatId] = useState<string | null>(null)

  // Only keep unread sessions for display
  const unreadSessions = useMemo(
    () => (sessions || []).filter((s) => isSessionUnread(s)),
    [sessions],
  )

  const hasUnreadSessions = unreadSessions.length > 0

  const handleSessionSelect = useCallback(
    async (session: AIChatSession) => {
      if (session.chatId === currentChatId) return
      try {
        await AIChatSessionService.fetchAndPersistMessages(session)
      } catch (e) {
        console.error("Failed to sync chat session messages:", e)
        toast.error("Failed to load chat messages")
      }
      chatActions.switchToChat(session.chatId)
    },
    [chatActions, currentChatId],
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
          chatActions.newChat()
        }
      } catch (error) {
        console.error("Failed to delete session:", error)
        toast.error(t("delete_chat_error"))
      } finally {
        setLoadingChatId(null)
      }
    },
    [sessions, ask, t, currentChatId, chatActions, deleteSessionMutation],
  )

  const defaultTrigger = (
    <ActionButton tooltip="Task Reports" className="relative">
      <i className="i-mgc-inbox-cute-re text-text-secondary size-5" />
      {hasUnreadSessions && (
        <span
          className="bg-accent absolute right-1 top-1 block size-2 rounded-full shadow-[0_0_0_2px_var(--color-bg-default)] dark:shadow-[0_0_0_2px_var(--color-bg-default)]"
          aria-label="Unread task reports"
        />
      )}
    </ActionButton>
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild={asChild}>
        {triggerElement || defaultTrigger}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        {unreadSessions.length > 0 ? (
          unreadSessions.map((session) => (
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
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

import { ActionButton } from "@follow/components/ui/button/index.js"
import type { AIChatSession } from "@follow-app/client-sdk"
import type { ReactElement } from "react"
import { useCallback, useState } from "react"
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
import {
  useAIChatSessionListQuery,
  useDeleteAIChatSessionMutation,
} from "~/modules/ai-chat-session/query"

interface TaskReportDropdownProps {
  triggerElement?: ReactElement
}

interface SessionItemProps {
  session: AIChatSession
  onClick?: () => void
  onDelete?: (e: React.MouseEvent) => void
  isDeleting?: boolean
}

const SessionItem = ({ session, onClick, onDelete, isDeleting }: SessionItemProps) => {
  const hasUnread =
    session.lastSeenAt && session.updatedAt
      ? new Date(session.updatedAt) > new Date(session.lastSeenAt)
      : false

  return (
    <DropdownMenuItem
      onClick={onClick}
      className={`group relative ${onClick ? "cursor-pointer" : "cursor-default"}`}
    >
      <div className="flex min-w-0 flex-1 justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <p className="mb-0.5 truncate font-medium">{session.title || "Untitled Chat"}</p>
          {hasUnread && <div className="bg-accent size-2 shrink-0 rounded-full" />}
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
              disabled={isDeleting}
            >
              {isDeleting ? (
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
      <i className="i-mgc-comment-cute-re text-text-secondary mb-2 block size-8" />
      <p className="text-text-secondary text-sm">No task reports yet</p>
      <p className="text-text-tertiary text-xs">Start a new conversation to begin</p>
    </div>
  )
}

export const TaskReportDropdown = ({ triggerElement }: TaskReportDropdownProps) => {
  const sessions = useAIChatSessionListQuery()
  const currentChatId = useCurrentChatId()
  const chatActions = useChatActions()
  const deleteSessionMutation = useDeleteAIChatSessionMutation()
  const { ask } = useDialog()
  const { t } = useTranslation("ai")
  const [deletingChatId, setDeletingChatId] = useState<string | null>(null)

  const handleSessionSelect = useCallback(
    (chatId: string) => {
      if (chatId !== currentChatId) {
        chatActions.switchToChat(chatId)
      }
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

      setDeletingChatId(chatId)
      try {
        await deleteSessionMutation.mutateAsync({ chatId })
        toast.success(t("delete_chat_success"))

        if (chatId === currentChatId) {
          chatActions.newChat()
        }
      } catch (error) {
        console.error("Failed to delete session:", error)
        toast.error(t("delete_chat_error"))
      } finally {
        setDeletingChatId(null)
      }
    },
    [sessions, ask, t, currentChatId, chatActions, deleteSessionMutation],
  )

  const defaultTrigger = (
    <ActionButton tooltip="Task Reports">
      <i className="i-mgc-comment-cute-re text-text-secondary size-5" />
    </ActionButton>
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{triggerElement || defaultTrigger}</DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        {sessions && sessions.length > 0 ? (
          sessions.map((session) => (
            <SessionItem
              key={session.chatId}
              session={session}
              onClick={() => handleSessionSelect(session.chatId)}
              onDelete={(e) => handleDeleteSession(session.chatId, e)}
              isDeleting={deletingChatId === session.chatId}
            />
          ))
        ) : (
          <EmptyState />
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

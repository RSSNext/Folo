import { ActionButton } from "@follow/components/ui/button/index.js"
import type { ReactNode } from "react"
import { startTransition, useCallback, useState } from "react"
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
import { useChatHistory } from "~/modules/ai-chat/hooks/useChatHistory"
import { useTimelineSummaryAutoContext } from "~/modules/ai-chat/hooks/useTimelineSummaryAutoContext"
import { AIPersistService } from "~/modules/ai-chat/services"
import { useChatActions, useCurrentChatId } from "~/modules/ai-chat/store/hooks"

interface ChatHistoryDropdownProps {
  triggerElement?: ReactNode
  asChild?: boolean
}

export const ChatHistoryDropdown = ({
  triggerElement,
  asChild = true,
}: ChatHistoryDropdownProps) => {
  const { t } = useTranslation("ai")
  const chatActions = useChatActions()
  const currentChatId = useCurrentChatId()
  const shouldDisableTimelineSummary = useTimelineSummaryAutoContext()
  const { ask } = useDialog()
  const [deletingChatId, setDeletingChatId] = useState<string | null>(null)
  const { sessions, loading, loadHistory } = useChatHistory()

  const handleDropdownOpen = useCallback(
    (open: boolean) => {
      if (open) {
        loadHistory()
        // AIPersistService.cleanupEmptySessions()
      }
    },
    [loadHistory],
  )

  const handleDeleteSession = useCallback(
    async (chatId: string, e: React.MouseEvent) => {
      e.stopPropagation()
      e.preventDefault()

      const session = sessions.find((s) => s.chatId === chatId)
      if (!session) return

      const confirm = await ask({
        title: t("delete_chat"),
        message: t("delete_chat_message", { title: session.title || t("common.new_chat") }),
        variant: "danger",
      })

      if (!confirm) return

      setDeletingChatId(chatId)
      try {
        await AIPersistService.deleteSession(chatId)
        toast.success(t("delete_chat_success"))

        if (chatId === currentChatId) {
          if (shouldDisableTimelineSummary) {
            chatActions.setTimelineSummaryManualOverride(true)
          }
          chatActions.newChat()
        }

        loadHistory()
      } catch (error) {
        console.error("Failed to delete session:", error)
        toast.error(t("delete_chat_error"))
      } finally {
        setDeletingChatId(null)
      }
    },
    [sessions, ask, t, currentChatId, loadHistory, chatActions, shouldDisableTimelineSummary],
  )

  const defaultTrigger = (
    <ActionButton tooltip="Chat History">
      <i className="i-mgc-history-cute-re size-5 text-text-secondary" />
    </ActionButton>
  )

  return (
    <DropdownMenu onOpenChange={handleDropdownOpen}>
      <DropdownMenuTrigger asChild={asChild}>
        {triggerElement || defaultTrigger}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-96 w-72 overflow-y-auto">
        {loading && sessions.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <i className="i-mgc-loading-3-cute-re size-5 animate-spin text-text-secondary" />
          </div>
        ) : sessions.length > 0 ? (
          <>
            <div className="mb-1.5 px-2 py-1">
              <p className="text-xs font-medium text-text-secondary">Recent Chats</p>
            </div>
            {sessions.map((session) => (
              <DropdownMenuItem
                key={session.chatId}
                onClick={() =>
                  startTransition(() => {
                    chatActions.setTimelineSummaryManualOverride(true)
                    chatActions.switchToChat(session.chatId)
                  })
                }
                className="group flex h-8 cursor-pointer items-center justify-between rounded-md px-2 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {session.title || t("common.new_chat")}
                  </p>
                </div>
                <div className="relative flex min-w-0 items-center">
                  <span className="ml-2 shrink-0 cursor-help text-xs text-text-secondary group-data-[highlighted]:text-text-secondary-dark">
                    <RelativeDay date={session.updatedAt} />
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteSession(session.chatId, e)}
                    className="absolute inset-y-0 right-0 flex items-center bg-accent px-2 py-1 text-white opacity-0 shadow-lg backdrop-blur-sm group-data-[highlighted]:text-white group-data-[highlighted]:opacity-100"
                    disabled={deletingChatId === session.chatId}
                  >
                    {deletingChatId === session.chatId ? (
                      <i className="i-mgc-loading-3-cute-re size-4 animate-spin" />
                    ) : (
                      <i className="i-mgc-delete-2-cute-re size-4" />
                    )}
                  </button>
                </div>
              </DropdownMenuItem>
            ))}
          </>
        ) : (
          <div className="flex flex-col items-center py-8 text-center">
            <i className="i-mgc-time-cute-re mb-2 block size-8 text-text-secondary" />
            <p className="text-sm text-text-secondary">No chat history yet</p>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

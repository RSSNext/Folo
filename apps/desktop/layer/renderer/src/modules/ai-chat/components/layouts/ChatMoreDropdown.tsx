import { ActionButton } from "@follow/components/ui/button/index.js"
import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { RelativeDay } from "~/components/ui/datetime"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu/dropdown-menu"
import { useDialog } from "~/components/ui/modal/stacked/hooks"
import { useChatHistory } from "~/modules/ai-chat/hooks/useChatHistory"
import { AIPersistService } from "~/modules/ai-chat/services"
import { useChatActions, useCurrentChatId, useCurrentTitle } from "~/modules/ai-chat/store/hooks"
import { downloadMarkdown, exportChatToMarkdown } from "~/modules/ai-chat/utils/export"

export const ChatMoreDropdown = () => {
  const currentTitle = useCurrentTitle()
  const currentChatId = useCurrentChatId()

  const chatActions = useChatActions()
  const { t } = useTranslation("ai")
  const { ask } = useDialog()
  const [deletingChatId, setDeletingChatId] = useState<string | null>(null)
  const { sessions, loading, loadHistory } = useChatHistory()

  const handleDropdownOpen = (open: boolean) => {
    if (open) {
      loadHistory()
      AIPersistService.cleanupEmptySessions()
    }
  }

  const handleDeleteSession = useCallback(
    async (chatId: string, e: React.MouseEvent) => {
      e.stopPropagation()
      e.preventDefault()

      const session = sessions.find((s) => s.chatId === chatId)
      if (!session) return

      const confirm = await ask({
        title: t("delete_chat"),
        message: t("delete_chat_message", { title: session.title || "New Chat" }),
        variant: "danger",
      })

      if (!confirm) return

      setDeletingChatId(chatId)
      try {
        await AIPersistService.deleteSession(chatId)
        toast.success(t("delete_chat_success"))

        if (chatId === currentChatId) {
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
    [sessions, ask, t, currentChatId, loadHistory, chatActions],
  )

  const handleExport = useCallback(() => {
    const messages = chatActions.getMessages()
    if (messages.length === 0) {
      toast.error(t("export_empty_chat"))
      return
    }

    try {
      const markdown = exportChatToMarkdown(messages, currentTitle)
      const filename = `${currentTitle || "AI_Chat"}_${new Date().toISOString().slice(0, 10)}.md`
      downloadMarkdown(markdown, filename)
      toast.success(t("export_success"))
    } catch (error) {
      toast.error(t("export_error"))
      console.error("Export error:", error)
    }
  }, [chatActions, currentTitle, t])

  return (
    <DropdownMenu onOpenChange={handleDropdownOpen}>
      <DropdownMenuTrigger asChild>
        <ActionButton tooltip="More">
          <i className="i-mingcute-more-1-fill size-5 opacity-80" />
        </ActionButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {/* Chat History Submenu */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <i className="i-mgc-history-cute-re size-4" />
            <span>Chat History</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="max-h-96 w-72 overflow-y-auto p-2">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <i className="i-mgc-loading-3-cute-re text-text-secondary size-5 animate-spin" />
              </div>
            ) : sessions.length > 0 ? (
              <>
                <div className="mb-1.5 px-2 py-1">
                  <p className="text-text-secondary text-xs font-medium">Recent Chats</p>
                </div>
                {sessions.map((session) => (
                  <DropdownMenuItem
                    key={session.chatId}
                    onClick={() => chatActions.switchToChat(session.chatId)}
                    className="group flex h-12 cursor-pointer items-center justify-between rounded-md px-2 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{session.title || "New Chat"}</p>
                      <p className="text-text-secondary group-hover:text-text-secondary-dark mt-0.5 text-xs">
                        <span>{session.messageCount}</span>
                        <span> {session.messageCount === 1 ? "message" : "messages"}</span>
                      </p>
                    </div>
                    <div className="relative flex min-w-0 items-center">
                      <span className="text-text-secondary group-hover:text-text-secondary-dark ml-2 shrink-0 text-xs">
                        <RelativeDay date={session.createdAt} />
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteSession(session.chatId, e)}
                        className="bg-accent absolute inset-y-0 right-0 flex items-center px-2 py-1 text-white opacity-0 shadow-lg backdrop-blur-sm group-data-[highlighted]:text-white group-data-[highlighted]:opacity-100"
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
                <DropdownMenuSeparator className="my-1.5" />
                <DropdownMenuItem
                  onClick={chatActions.newChat}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-2.5"
                >
                  <i className="i-mgc-add-cute-re size-4" />
                  <span className="text-sm">New Chat</span>
                </DropdownMenuItem>
              </>
            ) : (
              <div className="flex flex-col items-center py-8 text-center">
                <i className="i-mgc-time-cute-re text-text-secondary mb-2 block size-8" />
                <p className="text-text-secondary text-sm">No chat history yet</p>
              </div>
            )}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuItem onClick={handleExport}>
          <i className="i-mgc-download-2-cute-re mr-2 size-4" />
          <span>Export Chat</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

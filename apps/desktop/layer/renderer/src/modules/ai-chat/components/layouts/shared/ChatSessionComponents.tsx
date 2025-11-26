import type { AIChatSession } from "@follow-app/client-sdk"
import type { ReactNode } from "react"

import { RelativeDay } from "~/components/ui/datetime"
import { DropdownMenuItem } from "~/components/ui/dropdown-menu/dropdown-menu"
import type { ChatSession } from "~/modules/ai-chat/types/ChatSession"

import { isUnreadSession } from "./utils"

// Types
export interface SessionItemProps {
  session: ChatSession | AIChatSession
  onClick?: () => void
  onDelete?: (e: React.MouseEvent) => void
  isLoading?: boolean
  hasUnread?: boolean
}

export interface EmptyStateProps {
  message: string
  icon?: ReactNode
}

export const SessionItem = ({
  session,
  onClick,
  onDelete,

  isLoading = false,
  hasUnread = false,
}: SessionItemProps) => {
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
              className="absolute left-2 block size-2 shrink-0 rounded-full bg-accent group-hover:bg-white"
              aria-label="Unread"
              role="status"
            />
          )}
          <p className={`mb-0.5 truncate font-medium ${hasUnread ? "ml-2" : ""}`}>
            {session.title || "Untitled Chat"}
          </p>
        </div>
        <div className="relative flex min-w-0 items-center">
          <p className="ml-2 shrink-0 truncate text-xs text-text-secondary">
            <RelativeDay date={new Date(session.updatedAt)} />
          </p>
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              disabled={isLoading}
              className="absolute inset-y-0 right-0 flex items-center rounded-md bg-accent px-2 py-1 text-white opacity-0 group-data-[highlighted]:text-white group-data-[highlighted]:opacity-100"
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

export const EmptyState = ({ message, icon }: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center py-8 text-center">
      {icon || <i className="i-mgc-time-cute-re mb-2 block size-8 text-text-secondary" />}
      <p className="text-sm text-text-secondary">{message}</p>
    </div>
  )
}

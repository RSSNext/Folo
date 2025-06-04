import { FeedViewType } from "@follow/constants"
import { useIsEntryStarred } from "@follow/store/collection/hooks"
import { collectionSyncService } from "@follow/store/collection/store"
import { useEntry } from "@follow/store/entry/hooks"
import { unreadSyncService } from "@follow/store/unread/store"
import type { PropsWithChildren } from "react"
import { useTranslation } from "react-i18next"
import { Share } from "react-native"

import { ContextMenu } from "@/src/components/ui/context-menu"
import { toast } from "@/src/lib/toast"

type VideoContextMenuProps = PropsWithChildren<{
  entryId: string
}>

export const VideoContextMenu = ({ entryId, children }: VideoContextMenuProps) => {
  const { t } = useTranslation()
  const entry = useEntry(entryId, (state) => ({
    read: state.read,
    feedId: state.feedId,
    title: state.title,
    url: state.url,
  }))
  const feedId = entry?.feedId

  const isEntryStarred = useIsEntryStarred(entryId)

  if (!entry) {
    return children
  }

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger>{children}</ContextMenu.Trigger>

      <ContextMenu.Content>
        <ContextMenu.Item
          key="MarkAsRead"
          onSelect={() => {
            entry.read
              ? unreadSyncService.markEntryAsUnread(entryId)
              : unreadSyncService.markEntryAsRead(entryId)
          }}
        >
          <ContextMenu.ItemTitle>
            {entry.read ? t("operation.mark_as_unread") : t("operation.mark_as_read")}
          </ContextMenu.ItemTitle>
          <ContextMenu.ItemIcon
            ios={{
              name: entry.read ? "circle.fill" : "checkmark.circle",
            }}
          />
        </ContextMenu.Item>
        {feedId && (
          <ContextMenu.Item
            key="Star"
            onSelect={() => {
              if (isEntryStarred) {
                collectionSyncService.unstarEntry(entryId)
                toast.success("Unstarred")
              } else {
                collectionSyncService.starEntry({
                  feedId,
                  entryId,
                  view: FeedViewType.Videos,
                })
                toast.success("Starred")
              }
            }}
          >
            <ContextMenu.ItemIcon
              ios={{
                name: isEntryStarred ? "star.slash" : "star",
              }}
            />
            <ContextMenu.ItemTitle>
              {isEntryStarred ? t("operation.unstar") : t("operation.star")}
            </ContextMenu.ItemTitle>
          </ContextMenu.Item>
        )}

        <ContextMenu.Item
          key="Share"
          onSelect={async () => {
            if (!entry.url) return
            await Share.share({
              message: [entry.title, entry.url].filter(Boolean).join("\n"),
              url: entry.url,
              title: entry.title || "Shared Video",
            })
            return
          }}
        >
          <ContextMenu.ItemIcon
            ios={{
              name: "square.and.arrow.up",
            }}
          />
          <ContextMenu.ItemTitle>{t("operation.share")}</ContextMenu.ItemTitle>
        </ContextMenu.Item>
      </ContextMenu.Content>
    </ContextMenu.Root>
  )
}

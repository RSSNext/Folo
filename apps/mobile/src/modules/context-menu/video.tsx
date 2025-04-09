import type { PropsWithChildren } from "react"
import { useTranslation } from "react-i18next"
import { Share } from "react-native"

import { ContextMenu } from "@/src/components/ui/context-menu"
import { toast } from "@/src/lib/toast"
import { useSelectedView } from "@/src/modules/screen/atoms"
import { useIsEntryStarred } from "@/src/store/collection/hooks"
import { collectionSyncService } from "@/src/store/collection/store"
import { useEntry } from "@/src/store/entry/hooks"
import { unreadSyncService } from "@/src/store/unread/store"

type VideoContextMenuProps = PropsWithChildren<{
  entryId: string
}>

export const VideoContextMenu = ({ entryId, children }: VideoContextMenuProps) => {
  const { t } = useTranslation()
  const entry = useEntry(entryId)
  const feedId = entry?.feedId
  const view = useSelectedView()
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
        {feedId && view !== undefined && (
          <ContextMenu.Item
            key="Star"
            onSelect={() => {
              if (isEntryStarred) {
                collectionSyncService.unstarEntry(entryId)
                toast.info("Unstarred")
              } else {
                collectionSyncService.starEntry({
                  feedId,
                  entryId,
                  view,
                })
                toast.info("Starred")
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

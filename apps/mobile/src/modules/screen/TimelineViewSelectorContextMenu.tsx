import type { FeedViewType } from "@follow/constants"
import { unreadSyncService } from "@follow/store/unread/store"
import type { FC, PropsWithChildren } from "react"
import { useTranslation } from "react-i18next"

import { getHideAllReadSubscriptions } from "@/src/atoms/settings/general"
import { ContextMenu } from "@/src/components/ui/context-menu"

export const TimelineViewSelectorContextMenu: FC<
  PropsWithChildren<{ type: string | undefined; viewId: FeedViewType | undefined }>
> = ({ children, type, viewId }) => {
  const { t } = useTranslation()
  if (type !== "view" || viewId === undefined) return children

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger>{children}</ContextMenu.Trigger>
      <ContextMenu.Content>
        <ContextMenu.Item
          key="MarkAsRead"
          onSelect={() => {
            unreadSyncService.markViewAsRead({
              view: viewId,
              excludePrivate: getHideAllReadSubscriptions(),
            })
          }}
        >
          <ContextMenu.ItemTitle>{t("operation.mark_as_read")}</ContextMenu.ItemTitle>
          <ContextMenu.ItemIcon
            ios={{
              name: "checkmark.circle",
            }}
          />
        </ContextMenu.Item>
      </ContextMenu.Content>
    </ContextMenu.Root>
  )
}

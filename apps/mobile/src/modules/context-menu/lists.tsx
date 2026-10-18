import { getListById } from "@follow/store/list/getters"
import { subscriptionSyncService } from "@follow/store/subscription/store"
import { unreadSyncService } from "@follow/store/unread/store"
import type { FC, PropsWithChildren } from "react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Alert, Clipboard } from "react-native"

import { ContextMenu } from "@/src/components/ui/context-menu"
import { toastFetchError } from "@/src/lib/error-parser"
import { useNavigation } from "@/src/lib/navigation/hooks"
import { toast } from "@/src/lib/toast"
import { UrlBuilder } from "@/src/lib/url-builder"
import { FollowScreen } from "@/src/screens/(modal)/FollowScreen"

export const SubscriptionListItemContextMenu: FC<
  PropsWithChildren & {
    id: string
  }
> = ({ id, children }) => {
  const { t } = useTranslation()
  const navigation = useNavigation()
  const actions = useMemo(
    () =>
      [
        {
          title: t("operation.mark_as_read"),
          onSelect: () => {
            unreadSyncService.markListAsRead(id)
          },
        },
        {
          title: t("operation.edit"),
          onSelect: () => {
            const list = getListById(id)
            if (!list) return
            navigation.presentControllerView(FollowScreen, {
              type: "list",
              id: list.id,
            })
          },
        },
        {
          title: t("operation.copy_which", { which: t("operation.copy.link") }),
          onSelect: () => {
            const list = getListById(id)
            if (!list) return
            toast.success(t("operation.copy_which_success", { which: t("operation.copy.link") }))
            // On the web app of the environment the list is in, as a feed's share link is
            Clipboard.setString(UrlBuilder.shareList(list.id))
          },
        },
        {
          title: t("operation.unfollow"),
          destructive: true,
          onSelect: () => {
            Alert.alert(t("feed.unfollow.confirm_title"), t("feed.unfollow.confirm_description"), [
              {
                text: t("words.cancel", { ns: "common" }),
                style: "cancel",
              },
              {
                text: t("operation.unfollow"),
                style: "destructive",
                onPress: async () => {
                  try {
                    await subscriptionSyncService.unsubscribe(id)
                  } catch (error) {
                    // The store puts the list back, which alone would not say why
                    toastFetchError(error instanceof Error ? error : new Error(String(error)))
                  }
                },
              },
            ])
          },
        },
      ].filter((i) => !!i),
    [id, navigation, t],
  )

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger>{children}</ContextMenu.Trigger>

      <ContextMenu.Content>
        {actions.map((action) => {
          return (
            <ContextMenu.Item
              key={action.title}
              destructive={action.destructive}
              onSelect={action.onSelect}
            >
              <ContextMenu.ItemTitle>{action.title}</ContextMenu.ItemTitle>
            </ContextMenu.Item>
          )
        })}
      </ContextMenu.Content>
    </ContextMenu.Root>
  )
}

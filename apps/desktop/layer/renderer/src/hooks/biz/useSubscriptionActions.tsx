import { Kbd } from "@follow/components/ui/kbd/Kbd.js"
import { subscriptionSyncService } from "@follow/store/subscription/store"
import type { SubscriptionModel } from "@follow/store/subscription/types"
import { unreadActions } from "@follow/store/unread/store"
import { useMutation } from "@tanstack/react-query"
import { useHotkeys } from "react-hotkeys-hook"
import { Trans, useTranslation } from "react-i18next"
import { toast } from "sonner"

import { apiClient } from "~/lib/api-fetch"

import { navigateEntry } from "./useNavigateEntry"
import { getRouteParams } from "./useRouteParams"

export const useDeleteSubscription = ({ onSuccess }: { onSuccess?: () => void } = {}) => {
  const { t } = useTranslation()

  return useMutation({
    mutationFn: async ({
      subscription,
      feedIdList,
    }: {
      subscription?: SubscriptionModel
      feedIdList?: string[]
    }) => {
      if (feedIdList) {
        await subscriptionSyncService.unsubscribe(feedIdList)
        toast.success(t("notify.unfollow_feed_many"))
        return
      }

      if (!subscription) return

      subscriptionSyncService
        .unsubscribe([subscription.feedId, subscription.listId])
        .then(([feed]) => {
          subscriptionSyncService.fetch()
          unreadActions.updateById(subscription.feedId, 0)

          if (!subscription) return
          if (!feed) return
          const undo = async () => {
            // TODO store action
            const { unread } = await apiClient.subscriptions.$post({
              json: {
                url: feed.type === "feed" ? feed.url : undefined,
                listId: feed.type === "list" ? feed.id : undefined,
                view: subscription.view,
                category: subscription.category,
                isPrivate: subscription.isPrivate,
              },
            })
            unreadActions.upsertMany(unread)

            subscriptionSyncService.fetch()

            toast.dismiss(toastId)
          }

          const toastId = toast.warning("", {
            duration: 3000,
            description: <UnfollowInfo title={feed.title!} undo={undo} />,
            action: {
              label: (
                <span className={"flex items-center gap-1 px-1"}>
                  {t("words.undo")}
                  <Kbd className="border-border inline-flex items-center border bg-transparent text-white">
                    $mod+Z
                  </Kbd>
                </span>
              ),
              onClick: undo,
            },
          })
        })
    },

    onSuccess: (_) => {
      onSuccess?.()
    },
    onMutate(variables) {
      if (getRouteParams().feedId === variables.subscription?.feedId) {
        navigateEntry({
          feedId: null,
          entryId: null,
          view: getRouteParams().view,
        })
      }
    },
  })
}

const UnfollowInfo = ({ title, undo }: { title: string; undo: () => any }) => {
  useHotkeys("ctrl+z,meta+z", undo, {
    preventDefault: true,
  })
  return (
    <span className="text-text font-medium">
      <Trans
        ns="app"
        i18nKey="notify.unfollow_feed"
        components={{
          FeedItem: <i className="mr-px font-semibold">{title}</i>,
        }}
      />
    </span>
  )
}

export const useBatchUpdateSubscription = () => {
  return useMutation({
    mutationFn: async ({
      feedIdList,
      category,
      view,
    }: {
      feedIdList: string[]
      category?: string | null
      view: number
    }) => {
      await subscriptionSyncService.batchUpdateSubscription({
        category,
        feedIds: feedIdList,
        view,
      })
    },
  })
}

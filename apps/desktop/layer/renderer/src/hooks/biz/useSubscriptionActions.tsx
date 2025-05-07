import { Kbd } from "@follow/components/ui/kbd/Kbd.js"
import { useMutation } from "@tanstack/react-query"
import { useHotkeys } from "react-hotkeys-hook"
import { Trans, useTranslation } from "react-i18next"
import { toast } from "sonner"

import { HotKeyScopeMap } from "~/constants"
import { apiClient } from "~/lib/api-fetch"
import { subscription as subscriptionQuery } from "~/queries/subscriptions"
import type { SubscriptionFlatModel } from "~/store/subscription"
import { subscriptionActions } from "~/store/subscription"
import { feedUnreadActions } from "~/store/unread"

import { navigateEntry } from "./useNavigateEntry"
import { getRouteParams } from "./useRouteParams"

export const useDeleteSubscription = ({ onSuccess }: { onSuccess?: () => void } = {}) => {
  const { t } = useTranslation()

  return useMutation({
    mutationFn: async ({
      subscription,
      feedIdList,
    }: {
      subscription?: SubscriptionFlatModel
      feedIdList?: string[]
    }) => {
      if (feedIdList) {
        await subscriptionActions.unfollow(feedIdList)
        toast.success(t("notify.unfollow_feed_many"))
        return
      }

      if (!subscription) return

      subscriptionActions.unfollow([subscription.feedId]).then(([feed]) => {
        subscriptionQuery.all().invalidate()
        feedUnreadActions.updateByFeedId(subscription.feedId, 0)

        if (!subscription) return
        if (!feed) return
        const undo = async () => {
          // TODO store action
          await apiClient.subscriptions.$post({
            json: {
              url: feed.type === "feed" ? feed.url : undefined,
              listId: feed.type === "list" ? feed.id : undefined,
              view: subscription.view,
              category: subscription.category,
              isPrivate: subscription.isPrivate,
            },
          })

          subscriptionQuery.all().invalidate()
          feedUnreadActions.fetchUnreadByView(subscription.view)

          toast.dismiss(toastId)
        }

        const toastId = toast("", {
          duration: 3000,
          description: <UnfollowInfo title={feed.title!} undo={undo} />,
          action: {
            label: (
              <span className="flex items-center gap-1">
                {t("words.undo")}
                <Kbd className="border-border inline-flex items-center border bg-transparent dark:text-white">
                  Meta+Z
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
    scopes: HotKeyScopeMap.Home,
    preventDefault: true,
  })
  return (
    <Trans
      ns="app"
      i18nKey="notify.unfollow_feed"
      components={{
        FeedItem: <i className="mr-px font-semibold">{title}</i>,
      }}
    />
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
      await subscriptionActions.batchUpdateSubscription({
        category,
        feedIdList,
        view,
      })
    },
  })
}

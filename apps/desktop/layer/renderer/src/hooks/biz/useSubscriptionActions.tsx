import { Kbd } from "@follow/components/ui/kbd/Kbd.js"
import { subscriptionSyncService } from "@follow/store/subscription/store"
import type { SubscriptionModel } from "@follow/store/subscription/types"
import { useMutation } from "@tanstack/react-query"
import { useHotkeys } from "react-hotkeys-hook"
import { Trans, useTranslation } from "react-i18next"
import { toast } from "sonner"

import { toastFetchError } from "~/lib/error-parser"

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

      // Awaited so a failed request reaches onError; the store rolls the unfollow back
      const [feed] = await subscriptionSyncService.unsubscribe([
        subscription.feedId,
        subscription.listId,
      ])
      // Already applied locally; only servers without a change log need the full list.
      void subscriptionSyncService.refresh()

      if (!feed) return

      const undo = async () => {
        try {
          await subscriptionSyncService.subscribe({
            url: feed.type === "feed" ? feed.url : undefined,
            listId: feed.type === "list" ? feed.id : undefined,
            view: subscription.view,
            category: subscription.category,
            isPrivate: subscription.isPrivate,
            // The server looks a feed id up before a list id, so a list must not send one
            feedId: feed.type === "feed" ? feed.id : undefined,
            // The custom title, or none so the feed keeps following its own title
            title: subscription.title,
            hideFromTimeline: subscription.hideFromTimeline,
          })

          toast.dismiss(toastId)
        } catch (error) {
          toastFetchError(error as Error)
        }
      }

      const toastId = toast.warning("", {
        duration: 3000,
        // The name the sidebar showed, which is the custom title when there is one
        description: <UnfollowInfo title={subscription.title || feed.title || ""} undo={undo} />,
        action: {
          label: (
            <span className={"flex items-center gap-1 px-1"}>
              {t("words.undo")}
              <Kbd
                wrapButton={false}
                className="inline-flex items-center border border-border bg-transparent bg-none text-white"
              >
                $mod+Z
              </Kbd>
            </span>
          ),
          onClick: undo,
        },
      })
    },

    onSuccess: (_) => {
      onSuccess?.()
    },
    onError: (error) => {
      toastFetchError(error)
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
    <span className="font-medium text-text">
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

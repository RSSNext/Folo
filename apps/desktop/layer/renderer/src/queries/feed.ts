import { feedSyncServices } from "@follow/store/feed/store"
import { tracker } from "@follow/tracker"
import { formatXml } from "@follow/utils/utils"
import { useMutation } from "@tanstack/react-query"
import { useRef } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { ROUTE_FEED_IN_FOLDER, ROUTE_FEED_PENDING } from "~/constants"
import { useAuthQuery } from "~/hooks/common"
import { apiClient } from "~/lib/api-fetch"
import { defineQuery } from "~/lib/defineQuery"
import { toastFetchError } from "~/lib/error-parser"

import { entries } from "./entries"

type FeedQueryParams = { id?: string; url?: string }

export const feed = {
  byId: ({ id, url }: FeedQueryParams) =>
    defineQuery(
      ["feed", id, url],
      async () =>
        feedSyncServices.fetchFeedById({
          id,
          url,
        }),
      {
        rootKey: ["feed"],
      },
    ),
  claimMessage: ({ feedId }: { feedId: string }) =>
    defineQuery(["feed", "claimMessage", feedId], async () =>
      apiClient.feeds.claim.message.$get({ query: { feedId } }).then((res) => {
        res.data.json = JSON.stringify(JSON.parse(res.data.json), null, 2)
        const $document = new DOMParser().parseFromString(res.data.xml, "text/xml")
        res.data.xml = formatXml(new XMLSerializer().serializeToString($document))
        return res
      }),
    ),
  claimedList: () =>
    defineQuery(["feed", "claimedList"], async () => {
      const res = await apiClient.feeds.claim.list.$get()
      return res.data
    }),
}

export const useFeedQuery = ({ id, url }: FeedQueryParams) =>
  useAuthQuery(
    feed.byId({
      id,
      url,
    }),
    {
      enabled:
        (!!id || !!url) && id !== ROUTE_FEED_PENDING && !id?.startsWith(ROUTE_FEED_IN_FOLDER),
    },
  )

export const useClaimFeedMutation = (feedId: string) =>
  useMutation({
    mutationKey: ["claimFeed", feedId],
    mutationFn: () => feedSyncServices.claimFeed(feedId),

    async onError(err) {
      toastFetchError(err)
    },
    onSuccess() {
      tracker.feedClaimed({
        feedId,
      })
    },
  })

export const useRefreshFeedMutation = (feedId?: string) =>
  useMutation({
    mutationKey: ["refreshFeed", feedId],
    mutationFn: () => apiClient.feeds.refresh.$get({ query: { id: feedId! } }),

    onSuccess() {
      if (!feedId) return
      entries
        .entries({
          feedId: feedId!,
        })
        .invalidateRoot()
    },
    async onError(err) {
      toastFetchError(err)
    },
  })

export const useResetFeed = () => {
  const { t } = useTranslation()
  const toastIDRef = useRef<string | number | null>(null)

  return useMutation({
    mutationFn: async (feedId: string) => {
      toastIDRef.current = toast.loading(t("sidebar.feed_actions.resetting_feed"))
      await apiClient.feeds.reset.$get({ query: { id: feedId } })
    },
    onSuccess: (_, feedId) => {
      entries.entries({ feedId }).invalidateRoot()
      toast.success(
        t("sidebar.feed_actions.reset_feed_success"),
        toastIDRef.current ? { id: toastIDRef.current } : undefined,
      )
    },
    onError: () => {
      toast.error(
        t("sidebar.feed_actions.reset_feed_error"),
        toastIDRef.current ? { id: toastIDRef.current } : undefined,
      )
    },
  })
}

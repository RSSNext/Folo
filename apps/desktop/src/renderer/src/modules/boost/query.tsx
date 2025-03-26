import { tracker } from "@follow/tracker"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"

import { useAuthQuery, useI18n } from "~/hooks/common"
import { apiClient } from "~/lib/api-fetch"
import { defineQuery } from "~/lib/defineQuery"
import { toastFetchError } from "~/lib/error-parser"
import { userActions } from "~/store/user"

import { updateFeedBoostStatus } from "./atom"

const query = {
  getStatus: ({ feedId }: { feedId: string }) =>
    defineQuery(["boostFeed", feedId], async () => {
      const res = await apiClient.boosts.$get({
        query: {
          feedId,
        },
      })
      return res.data
    }),
  getBoosters: ({ feedId }: { feedId: string }) =>
    defineQuery(["boosters", feedId], async () => {
      return userActions.getBoosters(feedId)
    }),
}

export const useBoostStatusQuery = (feedId: string) =>
  useAuthQuery(query.getStatus({ feedId }), {
    staleTime: 1000 * 60 * 5,
  })

export const useFeedBoostersQuery = (feedId?: string) =>
  useAuthQuery(query.getBoosters({ feedId: feedId ?? "" }), {
    staleTime: 1000 * 60 * 5,
    enabled: feedId !== undefined,
  })

export const useBoostFeedMutation = () => {
  const t = useI18n()
  return useMutation({
    mutationFn: (data: Parameters<typeof apiClient.boosts.$post>[0]["json"]) =>
      apiClient.boosts.$post({ json: data }),
    onError(err) {
      toastFetchError(err)
    },
    onSuccess(_, variables) {
      query.getStatus({ feedId: variables.feedId }).invalidate()
      query.getBoosters({ feedId: variables.feedId }).invalidate()
      updateFeedBoostStatus(variables.feedId, true)

      tracker.boostSent({
        amount: variables.amount,
        feedId: variables.feedId,
      })
      toast(t("boost.boost_success"))
    },
  })
}

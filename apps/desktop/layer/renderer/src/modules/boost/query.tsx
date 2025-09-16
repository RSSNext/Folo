import { tracker } from "@follow/tracker"
import type { BoostFeedRequest } from "@follow-app/client-sdk"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"

import { useAuthQuery, useI18n } from "~/hooks/common"
import { followClient } from "~/lib/api-client"
import { defineQuery } from "~/lib/defineQuery"
import { toastFetchError } from "~/lib/error-parser"

import { updateFeedBoostStatus } from "./atom"

const query = {
  getStatus: ({ feedId }: { feedId: string }) =>
    defineQuery(["boostFeed", feedId], async () => {
      const res = await followClient.api.boosts.getFeedBoostLevel({
        feedId,
      })
      return res.data
    }),
  getBoosters: ({ feedId }: { feedId: string }) =>
    defineQuery(["boosters", feedId], async () => {
      const res = await followClient.api.boosts.getFeedBoosters({
        feedId,
      })

      return res.data
    }),
}

export const useBoostStatusQuery = (feedId: string) =>
  useAuthQuery(query.getStatus({ feedId }), {
    staleTime: 1000 * 60 * 5,
  })

export const useFeedBoostersQuery = (feedId: string | null | undefined) =>
  useAuthQuery(query.getBoosters({ feedId: feedId ?? "" }), {
    staleTime: 1000 * 60 * 5,
    enabled: feedId !== undefined,
  })

export const useBoostFeedMutation = () => {
  const t = useI18n()
  return useMutation({
    mutationFn: (data: BoostFeedRequest) =>
      followClient.api.boosts.boostFeed({
        amount: data.amount,
        feedId: data.feedId,
        TOTPCode: data.TOTPCode,
      }),
    onError(err) {
      toastFetchError(err)
    },
    onSuccess(response, variables) {
      query.getStatus({ feedId: variables.feedId }).invalidate()
      query.getBoosters({ feedId: variables.feedId }).invalidate()
      updateFeedBoostStatus(variables.feedId, true)

      tracker.boostSent({
        amount: variables.amount,
        feedId: variables.feedId,
        transactionId: response.data.transactionHash,
      })
      toast(t("boost.boost_success"))
    },
  })
}

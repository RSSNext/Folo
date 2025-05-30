import { createElement, useCallback } from "react"
import { useTranslation } from "react-i18next"

import { useModalStack } from "~/components/ui/modal/stacked/hooks"
import { getFeedById } from "~/store/feed"

import { FeedClaimModalContent } from "./feed-claim-modal"

export const useFeedClaimModal = () => {
  const { present } = useModalStack()
  const { t } = useTranslation()

  return useCallback(
    ({ feedId }: { feedId?: string }) => {
      if (!feedId) return

      const feed = getFeedById(feedId)

      if (!feed) return

      present({
        title: t("feed_claim_modal.title"),
        content: () => createElement(FeedClaimModalContent, { feedId }),
      })
    },
    [present, t],
  )
}

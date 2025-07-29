import type { FeedViewType } from "@follow/constants"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"

import { useModalStack } from "~/components/ui/modal/stacked/hooks"
import { useBatchUpdateSubscription } from "~/hooks/biz/useSubscriptionActions"

import { CategoryCreationModalContent } from "./modals"

export const useCategoryCreationModal = () => {
  const { t } = useTranslation()
  const { present } = useModalStack()
  const { mutate: addFeedsToCategoryMutation } = useBatchUpdateSubscription()
  return useCallback(
    (view: FeedViewType, feedIds: string[]) =>
      present({
        title: t("sidebar.feed_column.context_menu.title"),
        content: () => (
          <CategoryCreationModalContent
            onSubmit={(category: string) => {
              addFeedsToCategoryMutation({
                feedIdList: feedIds,
                category,
                view: view!,
              })
            }}
          />
        ),
      }),
    [addFeedsToCategoryMutation, present, t],
  )
}

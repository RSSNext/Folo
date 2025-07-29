import { useCallback } from "react"
import { useTranslation } from "react-i18next"

import { useModalStack } from "~/components/ui/modal/stacked/hooks"
import { useDeleteSubscription } from "~/hooks/biz/useSubscriptionActions"

import { ConfirmDestroyModalContent } from "../ConfirmDestroyModalContent"

export const useConfirmUnsubscribeSubscriptionModal = () => {
  const { present } = useModalStack()
  const deleteSubscription = useDeleteSubscription({})
  const { t } = useTranslation()
  return useCallback(
    (feedIds: string[]) => {
      present({
        title: t("sidebar.feed_actions.unfollow_feed_many_confirm"),
        icon: <i className="i-mingcute-warning-fill text-red" />,
        content: ({ dismiss }) => (
          <ConfirmDestroyModalContent
            onConfirm={() => {
              deleteSubscription.mutate({ feedIdList: feedIds })
              dismiss()
            }}
          />
        ),
      })
    },
    [deleteSubscription, present, t],
  )
}

import { DEEPLINK_SCHEME } from "@follow/shared/constants"
import { useCallback } from "react"

import { useWhoami } from "~/atoms/user"
import { useModalStack } from "~/components/ui/modal/stacked/hooks"
import { FeedForm } from "~/modules/discover/feed-form"
import { ListForm } from "~/modules/discover/list-form"

import { useI18n } from "../common"

export const usePresentFeedFormModal = () => {
  const { present } = useModalStack()
  const me = useWhoami()
  const t = useI18n()
  return useCallback(
    (
      params:
        | {
            feedId: string
          }
        | {
            listId: string
          },
    ) => {
      if (me) {
        const isList = !!("listId" in params)
        present({
          title: isList ? t("sidebar.feed_actions.edit_list") : t("sidebar.feed_actions.edit_feed"),
          content: ({ dismiss }) =>
            isList ? (
              <ListForm id={params.listId} onSuccess={dismiss} />
            ) : (
              <FeedForm id={params.feedId} onSuccess={dismiss} />
            ),
        })
      } else {
        window.location.href = `${DEEPLINK_SCHEME}add?id=${"feedId" in params ? params.feedId : params.listId}`
      }
    },
    [me, present, t],
  )
}

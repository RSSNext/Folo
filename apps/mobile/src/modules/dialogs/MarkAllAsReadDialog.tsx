import type { FeedViewType } from "@follow/constants"
import { unreadSyncService } from "@follow/store/unread/store"
import { t } from "i18next"
import { useTranslation } from "react-i18next"
import { View } from "react-native"

import { getHidePrivateSubscriptionsInTimeline } from "@/src/atoms/settings/general"
import { Text } from "@/src/components/ui/typography/Text"
import { CheckCircleCuteReIcon } from "@/src/icons/check_circle_cute_re"
import type { DialogComponent } from "@/src/lib/dialog"
import { Dialog } from "@/src/lib/dialog"

import type { SelectedFeed, SelectedTimeline } from "../screen/atoms"
import { getFetchEntryPayload } from "../screen/atoms"

export const MarkAllAsReadDialog: DialogComponent = () => {
  const { t } = useTranslation()
  return (
    <View>
      <Text className="text-label">{t("operation.mark_all_as_read_confirm")}</Text>
    </View>
  )
}
MarkAllAsReadDialog.title = t("operation.mark_all_as_read")
MarkAllAsReadDialog.id = "mark-all-as-read"
MarkAllAsReadDialog.headerIcon = <CheckCircleCuteReIcon />

/**
 * The caller passes the timeline it shows, because the dialog renders at the app root, outside
 * the screen's entry list context.
 */
export const showMarkAllAsReadDialog = (
  selectedFeed: SelectedTimeline | SelectedFeed,
  view: FeedViewType | undefined,
) => {
  Dialog.show(MarkAllAsReadDialog, {
    override: {
      onConfirm: (ctx) => {
        ctx.dismiss()
        if (typeof view !== "number") return
        unreadSyncService.markBatchAsRead({
          view,
          filter: getFetchEntryPayload(selectedFeed, view),
          excludePrivate: getHidePrivateSubscriptionsInTimeline(),
        })
      },
    },
  })
}

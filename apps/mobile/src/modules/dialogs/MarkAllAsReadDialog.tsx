import { unreadSyncService } from "@follow/store/unread/store"
import { t } from "i18next"
import { useTranslation } from "react-i18next"
import { View } from "react-native"

import { getHideAllReadSubscriptions } from "@/src/atoms/settings/general"
import { Text } from "@/src/components/ui/typography/Text"
import { CheckCircleCuteReIcon } from "@/src/icons/check_circle_cute_re"
import type { DialogComponent } from "@/src/lib/dialog"
import { Dialog } from "@/src/lib/dialog"

import { getFetchEntryPayload, useSelectedFeed, useSelectedView } from "../screen/atoms"

export const MarkAllAsReadDialog: DialogComponent = () => {
  const { t } = useTranslation()
  const selectedView = useSelectedView()
  const selectedFeed = useSelectedFeed()
  const ctx = Dialog.useDialogContext()
  return (
    <View>
      <Text className="text-label">{t("operation.mark_all_as_read_confirm")}</Text>
      <Dialog.DialogConfirm
        onPress={() => {
          ctx?.dismiss()
          if (typeof selectedView === "number") {
            const payload = getFetchEntryPayload(selectedFeed, selectedView)
            unreadSyncService.markBatchAsRead({
              view: selectedView,
              filter: payload,
              excludePrivate: getHideAllReadSubscriptions(),
            })
          }
        }}
      />
    </View>
  )
}
MarkAllAsReadDialog.title = t("operation.mark_all_as_read")
MarkAllAsReadDialog.id = "mark-all-as-read"
MarkAllAsReadDialog.headerIcon = <CheckCircleCuteReIcon />

import { t } from "i18next"
import { useTranslation } from "react-i18next"
import { Text, View } from "react-native"

import { CheckCircleCuteReIcon } from "@/src/icons/check_circle_cute_re"
import type { DialogComponent } from "@/src/lib/dialog"
import { Dialog } from "@/src/lib/dialog"
import { unreadSyncService } from "@/src/store/unread/store"

import { useSelectedView } from "../screen/atoms"

export const MarkAllAsReadDialog: DialogComponent = () => {
  const { t } = useTranslation()
  const selectedView = useSelectedView()
  const ctx = Dialog.useDialogContext()
  return (
    <View>
      <Text className="text-label">{t("operation.mark_all_as_read_confirm")}</Text>
      <Dialog.DialogConfirm
        onPress={() => {
          ctx?.dismiss()

          if (typeof selectedView === "number") {
            unreadSyncService.markViewAsRead(selectedView)
          }
        }}
      />
    </View>
  )
}

MarkAllAsReadDialog.title = t("operation.mark_all_as_read")
MarkAllAsReadDialog.id = "mark-all-as-read"

MarkAllAsReadDialog.headerIcon = <CheckCircleCuteReIcon />

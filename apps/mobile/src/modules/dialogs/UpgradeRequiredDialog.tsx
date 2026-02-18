import { t } from "i18next"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { View } from "react-native"

import { getIsPaymentEnabled } from "@/src/atoms/server-configs"
import { Text } from "@/src/components/ui/typography/Text"
import type { DialogComponent } from "@/src/lib/dialog"
import { Dialog } from "@/src/lib/dialog"

import { navigateToPlanScreen } from "../settings/routes/navigateToPlanScreen"

type UpgradeDialogPayload = {
  title?: string
  message?: string
}

const defaultPayload: UpgradeDialogPayload = {}
let currentPayload: UpgradeDialogPayload = defaultPayload

const getPayload = () => currentPayload

export const showUpgradeRequiredDialog = (payload?: UpgradeDialogPayload) => {
  if (!getIsPaymentEnabled()) {
    return
  }

  currentPayload = {
    title: payload?.title,
    message: payload?.message,
  }
  Dialog.show(UpgradeRequiredDialog)
}

const UpgradeRequiredDialog: DialogComponent = () => {
  const ctx = Dialog.useDialogContext()
  const { t: tSettings } = useTranslation("settings")
  const payload = getPayload()

  useEffect(() => {
    return () => {
      currentPayload = defaultPayload
    }
  }, [])

  const title = payload.title?.trim() || tSettings("subscription.actions.upgrade")
  const description = payload.message?.trim() || tSettings("subscription.summary.free_description")

  return (
    <View className="gap-3">
      <Text className="text-base font-semibold text-label">{title}</Text>
      <Text className="text-sm leading-relaxed text-secondary-label">{description}</Text>
      <Dialog.DialogConfirm
        onPress={() => {
          ctx?.dismiss()
          setTimeout(() => {
            void navigateToPlanScreen()
          }, 16)
        }}
      />
    </View>
  )
}

UpgradeRequiredDialog.id = "upgrade-required-dialog"
UpgradeRequiredDialog.confirmText = t("settings:subscription.actions.upgrade")

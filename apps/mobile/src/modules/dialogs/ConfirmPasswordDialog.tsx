import { useTranslation } from "react-i18next"
import { View } from "react-native"
import { useColor } from "react-native-uikit-colors"

import { PlainTextField } from "@/src/components/ui/form/TextField"
import { Text } from "@/src/components/ui/typography/Text"
import { Key2CuteReIcon } from "@/src/icons/key_2_cute_re"
import type { DialogComponent } from "@/src/lib/dialog"
import { Dialog } from "@/src/lib/dialog"

export const ConfirmPasswordDialog: DialogComponent<{
  password: string
}> = ({ ctx }) => {
  const { t } = useTranslation("settings")
  const label = useColor("label")
  const { bizOnConfirm } = Dialog.useDialogContext()!
  return (
    <View>
      <View className="flex-row items-center gap-2">
        <Key2CuteReIcon color={label} height={20} width={20} />
        <Text className="text-base font-medium text-label">
          {t("profile.password.confirm_to_continue")}
        </Text>
      </View>
      <PlainTextField
        autoFocus
        autoCapitalize="none"
        secureTextEntry
        className="my-3 rounded-xl bg-system-background p-2 px-4 text-text"
        placeholder={t("profile.password.label")}
        onChangeText={(text) => (ctx.password = text)}
        returnKeyType="done"
        onSubmitEditing={() => {
          bizOnConfirm?.()
        }}
      />
    </View>
  )
}
ConfirmPasswordDialog.id = "confirm-password-dialog"
// Confirm and cancel buttons fall back to the translated common labels in Dialog.show
ConfirmPasswordDialog.onConfirm = (ctx) => {
  ctx.dismiss()
}

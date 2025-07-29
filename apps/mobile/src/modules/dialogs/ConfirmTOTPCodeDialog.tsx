import { View } from "react-native"
import { useColor } from "react-native-uikit-colors"

import { PlainTextField } from "@/src/components/ui/form/TextField"
import { Text } from "@/src/components/ui/typography/Text"
import { Key2CuteReIcon } from "@/src/icons/key_2_cute_re"
import type { DialogComponent } from "@/src/lib/dialog"
import { Dialog } from "@/src/lib/dialog"

export const ConfirmTOTPCodeDialog: DialogComponent<{
  totpCode: string
}> = ({ ctx }) => {
  const label = useColor("label")
  const { bizOnConfirm } = Dialog.useDialogContext()!
  return (
    <View>
      <View className="flex-row items-center gap-2">
        <Key2CuteReIcon color={label} height={20} width={20} />
        <Text className="text-label text-base font-medium">Enter your TOTP code to continue</Text>
      </View>
      <PlainTextField
        autoFocus
        autoCapitalize="none"
        secureTextEntry
        className="bg-system-background text-text my-3 rounded-xl p-2 px-4"
        placeholder="TOTP Code"
        onChangeText={(text) => (ctx.totpCode = text)}
        returnKeyType="done"
        onSubmitEditing={() => {
          bizOnConfirm?.()
        }}
      />
    </View>
  )
}
ConfirmTOTPCodeDialog.id = "confirm-password-dialog"
ConfirmTOTPCodeDialog.confirmText = "Confirm"
ConfirmTOTPCodeDialog.cancelText = "Cancel"
ConfirmTOTPCodeDialog.onConfirm = (ctx) => {
  ctx.dismiss()
}

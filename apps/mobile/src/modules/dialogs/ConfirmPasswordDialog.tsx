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
  const label = useColor("label")
  const { bizOnConfirm } = Dialog.useDialogContext()!
  return (
    <View>
      <View className="flex-row items-center gap-2">
        <Key2CuteReIcon color={label} height={20} width={20} />
        <Text className="text-label text-base font-medium">Confirm your password to continue</Text>
      </View>
      <PlainTextField
        autoFocus
        autoCapitalize="none"
        secureTextEntry
        className="bg-system-background text-text my-3 rounded-xl p-2 px-4"
        placeholder="Password"
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
ConfirmPasswordDialog.confirmText = "Confirm"
ConfirmPasswordDialog.cancelText = "Cancel"
ConfirmPasswordDialog.onConfirm = (ctx) => {
  ctx.dismiss()
}

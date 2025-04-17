import { Text, TextInput, View } from "react-native"
import { useColor } from "react-native-uikit-colors"

import { LinkCuteReIcon } from "@/src/icons/link_cute_re"
import type { DialogComponent } from "@/src/lib/dialog"
import { Dialog } from "@/src/lib/dialog"
import { useNavigation } from "@/src/lib/navigation/hooks"
import { Navigation } from "@/src/lib/navigation/Navigation"
import { FollowScreen } from "@/src/screens/(modal)/FollowScreen"
import { accentColor } from "@/src/theme/colors"

export const AddFeedDialog: DialogComponent<{
  url: string
}> = ({ ctx }) => {
  const label = useColor("label")

  const navigation = useNavigation()
  const { dismiss } = Dialog.useDialogContext()!
  const handleAdd = () => {
    dismiss()
    const value = ctx.url
    if (!value) return
    navigation.pushControllerView(FollowScreen, {
      url: value,
      type: "url",
    })
  }

  return (
    <View>
      <View className="flex-row items-center gap-2">
        <LinkCuteReIcon color={label} height={20} width={20} />
        <Text className="text-label text-base font-medium">Enter Feed URL or RSSHub URL</Text>
      </View>
      <TextInput
        onChangeText={(text) => (ctx.url = text)}
        autoFocus
        enterKeyHint="done"
        cursorColor={accentColor}
        selectionColor={accentColor}
        onSubmitEditing={handleAdd}
        className="bg-system-background text-text my-3 rounded-xl p-2 px-4"
        placeholder="https:// or rsshub://"
      />
    </View>
  )
}

AddFeedDialog.confirmText = "Add"
AddFeedDialog.cancelText = "Cancel"

AddFeedDialog.onConfirm = (ctx) => {
  const value = ctx.url

  if (!value) return
  ctx.dismiss()

  setTimeout(() => {
    Navigation.rootNavigation.pushControllerView(FollowScreen, {
      url: value,
      type: "url",
    })
  }, 16)
}
AddFeedDialog.id = "add-feed-dialog"

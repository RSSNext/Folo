import { View } from "react-native"

import { useGeneralSettingKey } from "@/src/atoms/settings/general"
import { Text } from "@/src/components/ui/typography/Text"
import { CelebrateCuteReIcon } from "@/src/icons/celebrate_cute_re"
import { useColor } from "@/src/theme/colors"

export const EntryListEmpty = () => {
  const unreadOnly = useGeneralSettingKey("unreadOnly")
  const color = useColor("secondaryLabel")
  return (
    <View className="flex-1 items-center justify-center gap-2">
      {unreadOnly ? (
        <>
          <CelebrateCuteReIcon height={30} width={30} color={color} />
          <Text className="text-secondary-label text-lg font-medium">Zero Unread</Text>
        </>
      ) : (
        <Text className="text-secondary-label">No entries</Text>
      )}
    </View>
  )
}

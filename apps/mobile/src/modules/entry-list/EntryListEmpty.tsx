import { useAtomValue } from "jotai"
import { Text, View } from "react-native"

import { timelineSearchQueryAtom } from "@/src/atoms/search"
import { useGeneralSettingKey } from "@/src/atoms/settings/general"
import { CelebrateCuteReIcon } from "@/src/icons/celebrate_cute_re"
import { SearchLoupeCuteReIcon } from "@/src/icons/search_loupe_cute_re" // Or another appropriate icon
import { useColor } from "@/src/theme/colors"

export const EntryListEmpty = () => {
  const unreadOnly = useGeneralSettingKey("unreadOnly")
  const searchQuery = useAtomValue(timelineSearchQueryAtom)
  const color = useColor("secondaryLabel")

  if (searchQuery.trim()) {
    return (
      <View className="flex-1 items-center justify-center gap-2 p-4">
        <SearchLoupeCuteReIcon height={30} width={30} color={color} />
        <Text className="text-secondary-label text-center text-lg font-medium">
          No results found for "{searchQuery}"
        </Text>
      </View>
    )
  }

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

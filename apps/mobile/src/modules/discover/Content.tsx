import { useAtomValue } from "jotai"
import { View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { useSearchPageContext } from "@/src/modules/discover/ctx"
import { DiscoverContent } from "@/src/modules/discover/DiscoverContent"
import { SearchContent } from "@/src/modules/discover/SearchContent"

export default function Content() {
  const { searchFocusedAtom } = useSearchPageContext()
  const isFocused = useAtomValue(searchFocusedAtom)
  const insets = useSafeAreaInsets() // 获取安全区域

  return (
    <View style={{ paddingTop: insets.top }}>
      {isFocused ? <SearchContent /> : <DiscoverContent />}
    </View>
  )
}

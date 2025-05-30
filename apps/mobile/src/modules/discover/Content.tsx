import { useAtomValue } from "jotai"
import { View } from "react-native"

import { useSearchPageContext } from "@/src/modules/discover/ctx"
import { DiscoverContent } from "@/src/modules/discover/DiscoverContent"
import { SearchContent } from "@/src/modules/discover/SearchContent"

export default function Content() {
  const { searchFocusedAtom } = useSearchPageContext()
  const isFocused = useAtomValue(searchFocusedAtom)

  return <View>{isFocused ? <SearchContent /> : <DiscoverContent />}</View>
}

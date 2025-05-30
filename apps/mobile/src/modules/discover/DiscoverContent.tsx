import { View } from "react-native"

import { Category } from "@/src/modules/discover/Category"
import { Trending } from "@/src/modules/discover/Trending"

export function DiscoverContent() {
  return (
    <View>
      <Trending itemClassName="px-6" />
      <Category />
    </View>
  )
}

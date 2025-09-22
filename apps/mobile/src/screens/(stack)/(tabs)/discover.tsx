import { View } from "react-native"

import { SafeNavigationScrollView } from "@/src/components/layouts/views/SafeNavigationScrollView"
import type { TabScreenComponent } from "@/src/lib/navigation/bottom-tab/types"
import Content from "@/src/modules/discover/Content"
import {
  SearchPageProvider,
  SearchPageScrollContainerAnimatedXProvider,
} from "@/src/modules/discover/ctx"
import { DiscoverHeader } from "@/src/modules/discover/search"

export default function Discover() {
  return (
    <SearchPageScrollContainerAnimatedXProvider>
      <SearchPageProvider>
        <SafeNavigationScrollView
          Header={
            <View className="absolute top-0 z-10 w-full">
              <DiscoverHeader />
            </View>
          }
        >
          <Content />
        </SafeNavigationScrollView>
      </SearchPageProvider>
    </SearchPageScrollContainerAnimatedXProvider>
  )
}

export const DiscoverTabScreen: TabScreenComponent = Discover

DiscoverTabScreen.lazy = true

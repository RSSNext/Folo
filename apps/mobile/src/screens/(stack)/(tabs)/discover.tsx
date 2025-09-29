import { View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { SafeNavigationScrollView } from "@/src/components/layouts/views/SafeNavigationScrollView"
import type { TabScreenComponent } from "@/src/lib/navigation/bottom-tab/types"
import Content from "@/src/modules/discover/Content"
import {
  SearchPageProvider,
  SearchPageScrollContainerAnimatedXProvider,
} from "@/src/modules/discover/ctx"
import { DiscoverHeader } from "@/src/modules/discover/search"

export default function Discover() {
  const insets = useSafeAreaInsets() // 获取安全区域的顶部、底部、左右间距

  return (
    <SearchPageScrollContainerAnimatedXProvider>
      <SearchPageProvider>
        <SafeNavigationScrollView
          Header={
            <View className="absolute top-0 z-10 w-full" style={{ paddingTop: insets.top }}>
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

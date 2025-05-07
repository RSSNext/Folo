import { View } from "react-native"

import { SafeNavigationScrollView } from "@/src/components/layouts/views/SafeNavigationScrollView"
import { Search3CuteFiIcon } from "@/src/icons/search_3_cute_fi"
import { Search3CuteReIcon } from "@/src/icons/search_3_cute_re"
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
DiscoverTabScreen.tabBarIcon = ({ focused, color }) => {
  const Icon = !focused ? Search3CuteReIcon : Search3CuteFiIcon
  return <Icon color={color} width={24} height={24} />
}

DiscoverTabScreen.lazy = true

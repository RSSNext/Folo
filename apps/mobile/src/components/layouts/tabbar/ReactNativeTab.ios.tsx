import { Portal } from "@gorhom/portal"
import { use, useLayoutEffect } from "react"
import { Platform, View } from "react-native"
import DeviceInfo from "react-native-device-info"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { BottomTabContext } from "@/src/lib/navigation/bottom-tab/BottomTabContext"
import { TabBarPortal } from "@/src/lib/navigation/bottom-tab/TabBarPortal"
import { useNavigation } from "@/src/lib/navigation/hooks"
import { NavigationInstanceContext } from "@/src/lib/navigation/NavigationInstanceContext"
import { isIos26 } from "@/src/lib/platform"
import { GlassPlayerTabBar } from "@/src/modules/player/GlassPlayerTabBar"

import { BottomTabs } from "./BottomTabs"
import { SetBottomTabBarHeightContext } from "./contexts/BottomTabBarHeightContext"

const isIpad = Platform.OS === "ios" && DeviceInfo.isTablet()

export const ReactNativeTab = () => {
  if (isIos26 && !isIpad) {
    return <NativeTabBarHolder />
  }
  return (
    <TabBarPortal>
      <BottomTabs />
    </TabBarPortal>
  )
}

const NativeTabBarHolder = () => {
  const setHeight = use(SetBottomTabBarHeightContext)
  const insets = useSafeAreaInsets()

  const tabBarHeight = 68 + insets.bottom
  useLayoutEffect(() => {
    //https://developer.apple.com/design/human-interface-guidelines/tab-bars
    setHeight(tabBarHeight)
  }, [insets.bottom, setHeight, tabBarHeight])

  const bottomTabContext = use(BottomTabContext)
  const navigation = useNavigation()
  return (
    <Portal>
      <BottomTabContext value={bottomTabContext}>
        <NavigationInstanceContext value={navigation}>
          <View className="absolute inset-x-0 bottom-[68px] mb-4 bg-red">
            <GlassPlayerTabBar className="absolute inset-x-0 bottom-0" />
          </View>
        </NavigationInstanceContext>
      </BottomTabContext>
    </Portal>
  )
}

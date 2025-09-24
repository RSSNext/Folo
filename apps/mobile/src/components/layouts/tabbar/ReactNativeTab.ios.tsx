import { use, useLayoutEffect } from "react"
import { Platform } from "react-native"
import DeviceInfo from "react-native-device-info"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { TabBarPortal } from "@/src/lib/navigation/bottom-tab/TabBarPortal"
import { isIos26 } from "@/src/lib/platform"

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
  useLayoutEffect(() => {
    //https://developer.apple.com/design/human-interface-guidelines/tab-bars
    setHeight(68 + insets.bottom)
  }, [insets.bottom, setHeight])

  return null
}

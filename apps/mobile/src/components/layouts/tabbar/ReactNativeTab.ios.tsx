import { Platform } from "react-native"
import DeviceInfo from "react-native-device-info"

import { TabBarPortal } from "@/src/lib/navigation/bottom-tab/TabBarPortal"
import { isIos26 } from "@/src/lib/platform"

import { BottomTabs } from "./BottomTabs"

const isIpad = Platform.OS === "ios" && DeviceInfo.isTablet()

export const ReactNativeTab = () => {
  if (isIos26 && !isIpad) {
    return null
  }
  return (
    <TabBarPortal>
      <BottomTabs />
    </TabBarPortal>
  )
}

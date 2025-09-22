import { Platform } from "react-native"
import DeviceInfo from "react-native-device-info"
import { BottomTabs } from "react-native-screens"

import { TabBarPortal } from "@/src/lib/navigation/bottom-tab/TabBarPortal"

const isIpad = Platform.OS === "ios" && DeviceInfo.isTablet()
export const ReactNativeTab = () => {
  if (!isIpad) {
    return null
  }
  return (
    <TabBarPortal>
      <BottomTabs />
    </TabBarPortal>
  )
}

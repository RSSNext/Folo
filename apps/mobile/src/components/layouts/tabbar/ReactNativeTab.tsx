import { BottomTabs } from "react-native-screens"

import { TabBarPortal } from "@/src/lib/navigation/bottom-tab/TabBarPortal"

export const ReactNativeTab = () => {
  return (
    <TabBarPortal>
      <BottomTabs />
    </TabBarPortal>
  )
}

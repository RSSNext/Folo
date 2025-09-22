import { TabBarPortal } from "@/src/lib/navigation/bottom-tab/TabBarPortal"

import { BottomTabs } from "./BottomTabs"

export const ReactNativeTab = () => {
  return (
    <TabBarPortal>
      <BottomTabs />
    </TabBarPortal>
  )
}

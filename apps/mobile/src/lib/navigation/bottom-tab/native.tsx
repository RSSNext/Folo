import { View } from "react-native"

import type { TabBarRootWrapperProps } from "./types"

export { View as TabBarPortalWrapper } from "react-native"
export { View as TabScreenWrapper } from "react-native"

export const TabBarRootWrapper = (props: TabBarRootWrapperProps) => {
  return <View {...props} />
}

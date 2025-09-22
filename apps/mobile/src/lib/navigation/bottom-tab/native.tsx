import type { FC } from "react"
import { View } from "react-native"

import type { TabbarIconProps, TabBarRootWrapperProps } from "./types"

export { View as TabBarPortalWrapper } from "react-native"
export type TabScreenNativeProps = React.ComponentProps<typeof View> & {
  title?: string
  icon?: FC<TabbarIconProps> | string
  activeIcon?: FC<TabbarIconProps> | string
}
export const TabScreenWrapper = ({ title, icon, activeIcon, ...rest }: TabScreenNativeProps) => {
  // Non-iOS: no native TabBar, omit custom prop
  return <View {...rest} />
}

export const TabBarRootWrapper = (props: TabBarRootWrapperProps) => {
  return <View {...props} />
}

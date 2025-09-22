import type { FC } from "react"
import { View } from "react-native"

import type { IconNativeValues } from "@/src/constants/native-images"

import type { TabbarIconProps, TabBarRootWrapperProps } from "./types"

export { View as TabBarPortalWrapper } from "react-native"
export type TabScreenNativeProps = React.ComponentProps<typeof View> & {
  title?: string
  icon?: FC<TabbarIconProps> | IconNativeValues
  activeIcon?: FC<TabbarIconProps> | IconNativeValues
}
export const TabScreenWrapper = ({ title, icon, activeIcon, ...rest }: TabScreenNativeProps) => {
  // Non-iOS: no native TabBar, omit custom prop
  return <View {...rest} />
}

export const TabBarRootWrapper = ({
  onTabIndexChange,
  onTabItemPress,
  selectedIndex,
  ...props
}: TabBarRootWrapperProps) => {
  return <View {...props} />
}

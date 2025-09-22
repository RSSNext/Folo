import type { FC } from "react"
import type { NativeSyntheticEvent, ViewProps } from "react-native"

import type { IconNativeName } from "@/src/constants/native-images"

export type TabbarIconProps = {
  focused: boolean
  size?: number
  color?: string

  [key: string]: any
}
export type TabScreenComponent = FC & {
  lazy?: boolean
}
export interface TabScreenProps {
  title: string
  tabScreenIndex: number

  lazy?: boolean
  identifier?: string

  icon: IconNativeName
  activeIcon: IconNativeName
}

export interface ResolvedTabScreenProps extends Omit<TabScreenProps, "icon" | "activeIcon"> {
  icon: (props: TabbarIconProps) => React.ReactNode
}

export interface TabBarRootWrapperProps extends ViewProps {
  /**
   *
   * iOS only
   */
  onTabIndexChange: (e: NativeSyntheticEvent<{ index: number }>) => void
  /**
   * iOS only
   */
  onTabItemPress?: (e: NativeSyntheticEvent<{ index: number; currentIndex: number }>) => void

  selectedIndex: number
}

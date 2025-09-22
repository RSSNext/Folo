import type { FC } from "react"
import type { NativeSyntheticEvent, ViewProps } from "react-native"

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

  /**
   * iOS: Pass icon name
   * Other: Pass icon component
   */
  icon: string | React.FC<TabbarIconProps>
  /**
   * iOS: Pass icon name
   * Other: Pass icon component
   */
  activeIcon: string | React.FC<TabbarIconProps>
}

export interface ResolvedTabScreenProps extends Omit<TabScreenProps, "icon" | "activeIcon"> {
  icon: (props: TabbarIconProps) => React.ReactNode
}

export type TabBarRootWrapperProps = {
  onTabIndexChange: (e: NativeSyntheticEvent<{ index: number }>) => void
  selectedIndex: number
} & ViewProps

import type { FC } from "react"
import type { NativeSyntheticEvent, ViewProps } from "react-native"

export type TabbarIconProps = {
  focused: boolean
  size: number
  color: string
}
export type TabScreenComponent = FC & {
  tabBarIcon?: (props: TabbarIconProps) => React.ReactNode
  title?: string

  lazy?: boolean
}
export interface TabScreenProps {
  title: string
  tabScreenIndex: number
  renderIcon?: (props: TabbarIconProps) => React.ReactNode
  lazy?: boolean
  identifier?: string
}

export type TabBarRootWrapperProps = {
  onTabIndexChange: (e: NativeSyntheticEvent<{ index: number }>) => void
  selectedIndex: number
} & ViewProps

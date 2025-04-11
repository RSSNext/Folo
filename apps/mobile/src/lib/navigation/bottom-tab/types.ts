import type { FC } from "react"

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

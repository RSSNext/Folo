import { useState } from "react"

import { BottomTabBarHeightContext } from "@/src/components/layouts/tabbar/contexts/BottomTabBarHeightContext"

import { SetBottomTabBarHeightContext } from "./contexts/BottomTabBarHeightContext"

export const BottomTabHeightProvider = ({ children }: { children: React.ReactNode }) => {
  const [height, setHeight] = useState(0)

  return (
    <BottomTabBarHeightContext value={height}>
      <SetBottomTabBarHeightContext value={setHeight}>{children}</SetBottomTabBarHeightContext>
    </BottomTabBarHeightContext>
  )
}

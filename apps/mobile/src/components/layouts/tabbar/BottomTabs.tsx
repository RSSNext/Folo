import { use, useRef } from "react"

import { BottomTabBarBackgroundContext } from "./contexts/BottomTabBarBackgroundContext"
import { useNavigationScrollToTop } from "./hooks"
import { Tabbar } from "./Tabbar"

export const BottomTabs = () => {
  const currentIndex = useRef<number | undefined>(undefined)
  const scrollToTop = useNavigationScrollToTop()
  const { opacity } = use(BottomTabBarBackgroundContext)
  return (
    <Tabbar
      onPress={(index) => {
        opacity.value = 1

        if (currentIndex.current === index) {
          scrollToTop()
          return
        }

        currentIndex.current = index
      }}
    />
  )
}

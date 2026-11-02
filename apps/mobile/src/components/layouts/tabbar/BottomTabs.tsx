import { use } from "react"

import { BottomTabBarBackgroundContext } from "./contexts/BottomTabBarBackgroundContext"
import { useNavigationScrollToTop } from "./hooks"
import { Tabbar } from "./Tabbar"

export const BottomTabs = () => {
  const scrollToTop = useNavigationScrollToTop()
  const { opacity } = use(BottomTabBarBackgroundContext)
  return (
    <Tabbar
      onPress={(index, wasSelected) => {
        opacity.value = 1

        if (wasSelected) {
          scrollToTop(index)
        }
      }}
    />
  )
}

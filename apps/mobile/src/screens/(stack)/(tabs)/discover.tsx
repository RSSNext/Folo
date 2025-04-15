import { atom } from "jotai"
import { useMemo, useState } from "react"
import { useAnimatedValue } from "react-native"
import { useSharedValue } from "react-native-reanimated"

import { Search3CuteFiIcon } from "@/src/icons/search_3_cute_fi"
import { Search3CuteReIcon } from "@/src/icons/search_3_cute_re"
import type { TabScreenComponent } from "@/src/lib/navigation/bottom-tab/types"
import { StackScreenHeaderPortal } from "@/src/lib/navigation/StackScreenHeaderPortal"
import { DiscoverContext } from "@/src/modules/discover/DiscoverContext"
import { Recommendations } from "@/src/modules/discover/Recommendations"
import { DiscoverHeader } from "@/src/modules/discover/search"

export default function Discover() {
  const animatedX = useAnimatedValue(0)
  const currentTabAtom = useState(() => atom(0))[0]
  const headerHeightAtom = useState(() => atom(0))[0]
  const animatedY = useSharedValue(0)
  const ctxValue = useMemo(
    () => ({ animatedX, currentTabAtom, headerHeightAtom, animatedY }),
    [animatedX, currentTabAtom, headerHeightAtom, animatedY],
  )

  return (
    <DiscoverContext.Provider value={ctxValue}>
      <StackScreenHeaderPortal>
        <DiscoverContext.Provider value={ctxValue}>
          <DiscoverHeader />
        </DiscoverContext.Provider>
      </StackScreenHeaderPortal>

      <Recommendations />
    </DiscoverContext.Provider>
  )
}

export const DiscoverTabScreen: TabScreenComponent = Discover
DiscoverTabScreen.tabBarIcon = ({ focused, color }) => {
  const Icon = !focused ? Search3CuteReIcon : Search3CuteFiIcon
  return <Icon color={color} width={24} height={24} />
}

DiscoverTabScreen.lazy = true

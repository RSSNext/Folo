import { atom } from "jotai"
import { useMemo, useState } from "react"
import { useSharedValue } from "react-native-reanimated"

import type { BottomTabContextType } from "@/src/lib/navigation/bottom-tab/BottomTabContext"
import { BottomTabContext } from "@/src/lib/navigation/bottom-tab/BottomTabContext"
import type { TabScreenProps } from "@/src/lib/navigation/bottom-tab/types"

import { BottomTabHeightProvider } from "./BottomTabHeightProvider"
import { BottomTabBarBackgroundContext } from "./contexts/BottomTabBarBackgroundContext"
import {
  BottomTabBarVisibleContext,
  SetBottomTabBarVisibleContext,
} from "./contexts/BottomTabBarVisibleContext"

export const BottomTabProvider = ({
  children,
  initialTabIndex = 0,
}: {
  children: React.ReactNode
  initialTabIndex?: number
}) => {
  const opacity = useSharedValue(1)
  const [tabBarVisible, setTabBarVisible] = useState(true)

  const [tabIndexAtom] = useState(() => atom(initialTabIndex))

  const ctxValue = useMemo<BottomTabContextType>(
    () => ({
      currentIndexAtom: tabIndexAtom,
      loadedableIndexAtom: atom(new Set<number>()),
      tabScreensAtom: atom<TabScreenProps[]>([]),
      tabHeightAtom: atom(0),
    }),
    [tabIndexAtom],
  )

  return (
    <BottomTabContext.Provider value={ctxValue}>
      <BottomTabBarBackgroundContext.Provider value={useMemo(() => ({ opacity }), [opacity])}>
        <SetBottomTabBarVisibleContext.Provider value={setTabBarVisible}>
          <BottomTabBarVisibleContext.Provider value={tabBarVisible}>
            <BottomTabHeightProvider>{children}</BottomTabHeightProvider>
          </BottomTabBarVisibleContext.Provider>
        </SetBottomTabBarVisibleContext.Provider>
      </BottomTabBarBackgroundContext.Provider>
    </BottomTabContext.Provider>
  )
}

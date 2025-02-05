import { Stack } from "expo-router"
import { atom } from "jotai"
import { useMemo, useState } from "react"
import { useAnimatedValue } from "react-native"

import { DiscoverContext } from "@/src/modules/discover/DiscoverContext"
import { Recommendations } from "@/src/modules/discover/Recommendations"
import { DiscoverHeader } from "@/src/modules/discover/search"

export default function Discover() {
  const animatedX = useAnimatedValue(0)
  const currentTabAtom = useState(() => atom(0))[0]
  const headerHeightAtom = useState(() => atom(0))[0]
  const ctxValue = useMemo(
    () => ({ animatedX, currentTabAtom, headerHeightAtom }),
    [animatedX, currentTabAtom, headerHeightAtom],
  )
  return (
    <DiscoverContext.Provider value={ctxValue}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTransparent: true,

          header: () => {
            return (
              <DiscoverContext.Provider value={ctxValue}>
                <DiscoverHeader />
              </DiscoverContext.Provider>
            )
          },
        }}
      />

      <Recommendations />
    </DiscoverContext.Provider>
  )
}

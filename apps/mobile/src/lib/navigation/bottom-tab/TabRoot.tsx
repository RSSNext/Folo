import { atom } from "jotai"
import type { FC, PropsWithChildren } from "react"
import * as React from "react"
import { useMemo, useState } from "react"
import { StyleSheet, View } from "react-native"

import type { BottomTabContextType } from "./BottomTabContext"
import { BottomTabContext } from "./BottomTabContext"
import { TabScreen } from "./TabScreen"
import type { TabScreenProps } from "./types"

interface TabRootProps {
  initialTabIndex?: number
}

export const TabRoot: FC<TabRootProps & PropsWithChildren> = ({
  children,
  initialTabIndex = 0,
}) => {
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

  const MapChildren = useMemo(() => {
    let cnt = 0
    return React.Children.map(children, (child) => {
      if (typeof child === "object" && child && "type" in child && child.type === TabScreen) {
        return React.cloneElement(child, {
          tabScreenIndex: cnt++,
        })
      }
      return child
    })
  }, [children])
  return (
    <BottomTabContext.Provider value={ctxValue}>
      <View style={StyleSheet.absoluteFill}>{MapChildren}</View>
    </BottomTabContext.Provider>
  )
}

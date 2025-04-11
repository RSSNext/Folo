import { requireNativeView } from "expo"
import { atom, useAtom } from "jotai"
import type { FC, PropsWithChildren } from "react"
import * as React from "react"
import { useCallback, useMemo, useState } from "react"
import type { NativeSyntheticEvent, ViewProps } from "react-native"
import { StyleSheet } from "react-native"

import type { BottomTabContextType } from "./BottomTabContext"
import { BottomTabContext } from "./BottomTabContext"
import { TabScreen } from "./TabScreen.ios"
import type { TabScreenProps } from "./types"

interface TabRootProps {
  initialTabIndex?: number
}

const TabBarRoot = requireNativeView<
  {
    onTabIndexChange: (e: NativeSyntheticEvent<{ index: number }>) => void
    selectedIndex: number
  } & ViewProps
>("TabBarRoot")

export const TabRoot: FC<TabRootProps & PropsWithChildren> = ({
  children,
  initialTabIndex = 0,
}) => {
  const [tabIndexAtom] = useState(() => atom(initialTabIndex))
  const [tabIndex, setTabIndex] = useAtom(tabIndexAtom)

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
      <TabBarRoot
        style={StyleSheet.absoluteFill}
        onTabIndexChange={useCallback(
          (e) => {
            setTabIndex(e.nativeEvent.index)
          },
          [setTabIndex],
        )}
        selectedIndex={tabIndex}
      >
        {MapChildren}
      </TabBarRoot>
    </BottomTabContext.Provider>
  )
}

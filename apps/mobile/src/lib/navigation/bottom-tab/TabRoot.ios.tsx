import { requireNativeView } from "expo"
import { useAtom } from "jotai"
import type { FC, PropsWithChildren } from "react"
import * as React from "react"
import { useCallback, useMemo } from "react"
import type { NativeSyntheticEvent, ViewProps } from "react-native"
import { StyleSheet } from "react-native"

import { BottomTabContext } from "./BottomTabContext"
import { TabScreen } from "./TabScreen.ios"

const TabBarRoot = requireNativeView<
  {
    onTabIndexChange: (e: NativeSyntheticEvent<{ index: number }>) => void
    selectedIndex: number
  } & ViewProps
>("TabBarRoot")

export const TabRoot: FC<PropsWithChildren> = ({ children }) => {
  const { currentIndexAtom } = React.useContext(BottomTabContext)
  const [tabIndex, setTabIndex] = useAtom(currentIndexAtom)

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
  )
}

import { useAtom } from "jotai"
import type { FC, PropsWithChildren } from "react"
import * as React from "react"
import { use, useCallback, useMemo } from "react"
import { StyleSheet } from "react-native"

import { BottomTabContext } from "./BottomTabContext"
import { TabBarRootWrapper } from "./native"
import { TabScreen } from "./TabScreen"
import type { TabScreenProps } from "./types"

export const TabRoot: FC<PropsWithChildren> = ({ children }) => {
  const { currentIndexAtom } = use(BottomTabContext)
  const [tabIndex, setTabIndex] = useAtom(currentIndexAtom)

  const MapChildren = useMemo(() => {
    let cnt = 0
    return React.Children.map(children, (child) => {
      if (typeof child === "object" && child && "type" in child && child.type === TabScreen) {
        return React.cloneElement(child, {
          tabScreenIndex: cnt++,
        } as Partial<TabScreenProps>)
      }
      return child
    })
  }, [children])
  return (
    <TabBarRootWrapper
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
    </TabBarRootWrapper>
  )
}

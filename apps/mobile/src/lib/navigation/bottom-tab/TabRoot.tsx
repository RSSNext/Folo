import { useTypeScriptHappyCallback } from "@follow/hooks"
import { useAtom } from "jotai"
import type { FC, PropsWithChildren } from "react"
import * as React from "react"
import { use, useCallback, useMemo } from "react"
import { StyleSheet } from "react-native"

import { useNavigationScrollToTop } from "@/src/components/layouts/tabbar/hooks"

import { BottomTabContext } from "./BottomTabContext"
import { TabBarRootWrapper } from "./native"
import { TabScreen } from "./TabScreen"
import type { TabScreenProps } from "./types"

export const TabRoot: FC<PropsWithChildren> = ({ children }) => {
  const { currentIndexAtom } = use(BottomTabContext)
  const [tabIndex, setTabIndex] = useAtom(currentIndexAtom)

  const scrollToTop = useNavigationScrollToTop()

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
          const index = e.nativeEvent?.index
          if (index != null) {
            setTabIndex(index)
          }
        },
        [setTabIndex],
      )}
      onTabItemPress={useTypeScriptHappyCallback(
        (e) => {
          const { nativeEvent } = e
          if (!nativeEvent) return
          const { index, currentIndex } = nativeEvent
          if (index != null && index === currentIndex) {
            scrollToTop()
          }
        },
        [scrollToTop],
      )}
      selectedIndex={tabIndex}
    >
      {MapChildren}
    </TabBarRootWrapper>
  )
}

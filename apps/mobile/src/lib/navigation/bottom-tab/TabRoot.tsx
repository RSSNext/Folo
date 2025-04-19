import type { FC, PropsWithChildren } from "react"
import * as React from "react"
import { useMemo } from "react"
import { StyleSheet, View } from "react-native"

import { TabScreen } from "./TabScreen"

export const TabRoot: FC<PropsWithChildren> = ({ children }) => {
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
  return <View style={StyleSheet.absoluteFill}>{MapChildren}</View>
}

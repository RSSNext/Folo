import { requireNativeView } from "expo"
import { useSetAtom } from "jotai"
import { useContext } from "react"
import type { ViewProps } from "react-native"
import { StyleSheet, View } from "react-native"

import { BottomTabContext } from "./BottomTabContext"

const TabBarPortalNative = requireNativeView<ViewProps>("TabBarPortal")

export const TabBarPortal = ({ children }: { children: React.ReactNode }) => {
  const { tabHeightAtom } = useContext(BottomTabContext)
  const setTabHeight = useSetAtom(tabHeightAtom)
  return (
    // Use native view
    <TabBarPortalNative style={styles.container}>
      <View
        onLayout={(e) => {
          setTabHeight(e.nativeEvent.layout.height)
        }}
      >
        {children}
      </View>
    </TabBarPortalNative>
  )
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
})

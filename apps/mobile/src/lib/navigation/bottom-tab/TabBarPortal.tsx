import { useSetAtom } from "jotai"
import { use } from "react"
import { StyleSheet, View } from "react-native"

import { BottomTabContext } from "./BottomTabContext"

export const TabBarPortal = ({ children }: { children: React.ReactNode }) => {
  const { tabHeightAtom } = use(BottomTabContext)
  const setTabHeight = useSetAtom(tabHeightAtom)
  return (
    <View style={styles.container}>
      <View
        onLayout={(e) => {
          setTabHeight(e.nativeEvent.layout.height)
        }}
      >
        {children}
      </View>
    </View>
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

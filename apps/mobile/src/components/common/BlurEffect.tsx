import { StyleSheet } from "react-native"

import { ThemedBlurView } from "@/src/components/common/ThemedBlurView"

const node = (
  <ThemedBlurView
    style={{
      ...StyleSheet.absoluteFillObject,
      overflow: "hidden",
      backgroundColor: "transparent",
    }}
  />
)
export const BlurEffect = () => {
  return node
}

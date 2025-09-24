import { GlassView } from "expo-glass-effect"
import { StyleSheet } from "react-native"

import { ThemedBlurView } from "@/src/components/common/ThemedBlurView"
import { isIos26 } from "@/src/lib/platform"

const node = (
  <ThemedBlurView
    style={{
      ...StyleSheet.absoluteFillObject,
      overflow: "hidden",
      backgroundColor: "transparent",
    }}
  />
)

const glassNode = (
  <GlassView
    style={{
      ...StyleSheet.absoluteFillObject,
      overflow: "hidden",
      backgroundColor: "transparent",
    }}
    glassEffectStyle="regular"
  />
)
export const BlurEffect = () => {
  return isIos26 ? glassNode : node
}

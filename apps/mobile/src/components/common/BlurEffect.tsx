import { GlassView } from "expo-glass-effect"
import { StyleSheet } from "react-native"

import { ThemedBlurView } from "@/src/components/common/ThemedBlurView"
import { isIos26 } from "@/src/lib/platform"

export const BlurEffect = () => {
  if (isIos26) {
    return <GlassView style={styles.fill} glassEffectStyle="regular" />
  }
  return <ThemedBlurView style={styles.fill} />
}

const styles = StyleSheet.create({
  fill: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
    backgroundColor: "transparent",
  },
})

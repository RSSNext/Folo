import type { BlurViewProps } from "expo-blur"
import { BlurView } from "expo-blur"
import { useColorScheme } from "nativewind"
import { forwardRef } from "react"
import { Platform, StyleSheet, View } from "react-native"
import { useColor } from "react-native-uikit-colors"

export const ThemedBlurView = forwardRef<BlurView, BlurViewProps>(({ tint, ...rest }, ref) => {
  const { colorScheme } = useColorScheme()

  const background = useColor("systemBackground")

  return Platform.OS === "ios" ? (
    <BlurView
      ref={ref}
      intensity={100}
      tint={colorScheme === "light" ? "systemChromeMaterialLight" : "systemChromeMaterialDark"}
      {...rest}
    />
  ) : (
    <View
      ref={ref as any}
      {...rest}
      style={StyleSheet.flatten([
        rest.style,
        {
          backgroundColor: background,
          opacity: 1,
        },
      ])}
    />
  )
})

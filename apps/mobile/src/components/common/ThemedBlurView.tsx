import type { BlurViewProps } from "expo-blur"
import { BlurView } from "expo-blur"
import { useColorScheme } from "nativewind"
import { Platform, StyleSheet, View } from "react-native"
import { useColor } from "react-native-uikit-colors"

/**
 * @android In Android, the BlurView is experimental and not fully supported,
 * so we use a normal View with a background color with **100% opacity**.
 * However, if the `experimentalBlurMethod` prop is explicitly provided,
 * we'll use the BlurView even on Android,
 */
export const ThemedBlurView = ({
  ref,
  tint,
  ...rest
}: BlurViewProps & { ref?: React.Ref<BlurView | null> }) => {
  const { colorScheme } = useColorScheme()

  const background = useColor("systemBackground")

  const useBlurView = Platform.OS === "ios" || "experimentalBlurMethod" in rest

  return useBlurView ? (
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
}

import type { BlurViewProps } from "expo-blur"
import { BlurView } from "expo-blur"
import { GlassView } from "expo-glass-effect"
import { useColorScheme } from "nativewind"
import { Platform, StyleSheet, View } from "react-native"
import { useColor } from "react-native-uikit-colors"

import { isIos26 } from "@/src/lib/platform"

/**
 * @android In Android, the BlurView is experimental and not fully supported,
 * so we use a normal View with a background color with **100% opacity**.
 * However, if the `experimentalBlurMethod` prop is explicitly provided,
 * we'll use the BlurView even on Android,
 */
export const ThemedBlurView = ({
  ref,
  tint,

  tintColor,
  useGlass,
  ...rest
}: BlurViewProps & {
  ref?: React.Ref<BlurView | null>
  useGlass?: boolean
  /**
   * The tint color of the glass view, only works when `useGlass` is true
   */
  tintColor?: string
}) => {
  const { colorScheme } = useColorScheme()

  const background = useColor("systemBackground")

  const useBlurView = Platform.OS === "ios" || "experimentalBlurMethod" in rest

  if (isIos26 && useGlass) {
    return <GlassView style={rest.style} glassEffectStyle="regular" tintColor={tintColor} />
  }
  return useBlurView ? (
    <>
      <BlurView
        ref={ref}
        intensity={100}
        tint={colorScheme === "light" ? "systemChromeMaterialLight" : "systemChromeMaterialDark"}
        {...rest}
      />
      {tintColor && (
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: tintColor }]} />
      )}
    </>
  ) : (
    <View
      ref={ref as any}
      {...rest}
      style={StyleSheet.flatten([
        rest.style,
        {
          backgroundColor: tintColor ?? background,
          opacity: 1,
        },
      ])}
    />
  )
}

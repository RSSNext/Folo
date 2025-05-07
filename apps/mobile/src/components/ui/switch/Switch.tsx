import { useEffect, useImperativeHandle } from "react"
import type { SwitchChangeEvent } from "react-native"
import { Pressable, StyleSheet, View } from "react-native"
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated"

import { accentColor, useColor } from "@/src/theme/colors"

export interface SwitchProps {
  onChange?: ((event: SwitchChangeEvent) => Promise<void> | void) | null | undefined

  /**
   * Invoked with the new value when the value changes.
   */
  onValueChange?: ((value: boolean) => Promise<void> | void) | null | undefined

  /**
   * The value of the switch. If true the switch will be turned on.
   * Default value is false.
   */
  value?: boolean | undefined

  size?: "sm" | "default"
}

export type SwitchRef = {
  value: boolean
}
export const Switch = ({
  ref,
  value,
  onValueChange,
  onChange,
  size = "default",
}: SwitchProps & { ref?: React.Ref<SwitchRef | null> }) => {
  const progress = useSharedValue(value ? 1 : 0)
  const scale = useSharedValue(1)
  const translateX = useSharedValue(0)

  const onTouchStart = () => {
    scale.value = withSpring(1.1)
    if (value) {
      translateX.value = withSpring(size === "sm" ? -4 : -7)
    }
  }

  const onTouchEnd = () => {
    scale.value = withSpring(1)
    translateX.value = withSpring(0)
  }

  useImperativeHandle(ref, () => ({
    value: !!value,
  }))

  const activeBgColor = accentColor
  const inactiveBgColor = useColor("secondarySystemFill")

  const toggleStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      progress.value,
      [0, 1],
      [inactiveBgColor, activeBgColor],
    )

    return {
      backgroundColor,
    }
  })

  const circleStyle = useAnimatedStyle(() => {
    const marginLeft = interpolate(progress.value, [0, 1], size === "sm" ? [2, 20] : [2.3, 22])

    const width = interpolate(scale.value, [1, 1.1], size === "sm" ? [18, 21] : [27.8, 35])

    return {
      marginLeft,
      width,
      transform: [{ translateX: translateX.value }, { translateY: -0.4 }, { scale: scale.value }],
    }
  })

  useEffect(() => {
    // Update progress when value changes
    if (value && progress.value === 0) {
      progress.value = withTiming(1)
    } else if (!value && progress.value === 1) {
      progress.value = withTiming(0)
    }
  }, [progress, value])

  return (
    <View style={styles.container}>
      <Pressable
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onPress={() => {
          onValueChange?.(!value)
          onChange?.({ target: { value: !value } as any } as SwitchChangeEvent)
        }}
      >
        <Animated.View
          style={[size === "sm" ? styles.toggleContainerSm : styles.toggleContainer, toggleStyle]}
        >
          <Animated.View
            style={[
              size === "sm" ? styles.toggleWheelStyleSm : styles.toggleWheelStyle,
              circleStyle,
            ]}
          />
        </Animated.View>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { display: "flex", justifyContent: "space-between" },
  toggleContainer: {
    width: 52,
    height: 32.7,
    borderRadius: 4000,
    justifyContent: "center",
  },
  toggleContainerSm: {
    width: 40,
    height: 24,
    borderRadius: 4000,
    justifyContent: "center",
  },
  toggleWheelStyle: {
    height: 28.5,
    backgroundColor: "#ffffff",
    borderRadius: 200,
    shadowColor: "#515151",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2.5,
    elevation: 1.5,
  },
  toggleWheelStyleSm: {
    height: 20,
    backgroundColor: "#ffffff",
    borderRadius: 200,
    shadowColor: "#515151",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2.5,
    elevation: 1.5,
  },
})

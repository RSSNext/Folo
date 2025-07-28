import { useEffect, useImperativeHandle } from "react"
import type { SwitchChangeEvent } from "react-native"
import { Pressable, StyleSheet } from "react-native"
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
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
  value = false,
  onValueChange,
  onChange,
  size = "default",
}: SwitchProps & { ref?: React.Ref<SwitchRef | null> }) => {
  const gray3 = useColor("gray3")
  const animatedValue = useSharedValue(value ? 1 : 0)

  const dimensions =
    size === "sm"
      ? { width: 40, height: 24, thumbSize: 20 }
      : { width: 48, height: 28, thumbSize: 24 }

  useEffect(() => {
    animatedValue.value = withSpring(value ? 1 : 0, {
      damping: 15,
      stiffness: 200,
    })
  }, [value])

  useImperativeHandle(ref, () => ({
    value: value || false,
  }))

  const handlePress = () => {
    const newValue = !value
    onValueChange?.(newValue)
    onChange?.({
      nativeEvent: { value: newValue },
    } as SwitchChangeEvent)
  }

  const trackAnimatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(animatedValue.value, [0, 1], [gray3, accentColor])

    return {
      backgroundColor,
    }
  })

  const thumbAnimatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      animatedValue.value,
      [0, 1],
      [2, dimensions.width - dimensions.thumbSize - 2],
    )

    return {
      transform: [{ translateX }],
    }
  })

  return (
    <Pressable onPress={handlePress} className="opacity-100" style={styles.container}>
      <Animated.View
        style={[
          styles.track,
          { width: dimensions.width, height: dimensions.height },
          trackAnimatedStyle,
        ]}
      >
        <Animated.View
          style={[
            styles.thumb,
            {
              width: dimensions.thumbSize,
              height: dimensions.thumbSize,
            },
            thumbAnimatedStyle,
          ]}
        />
      </Animated.View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
  track: {
    borderRadius: 999,
    justifyContent: "center",
    position: "relative",
  },
  thumb: {
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    position: "absolute",
    top: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
})

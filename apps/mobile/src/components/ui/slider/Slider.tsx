import * as React from "react"
import { useCallback, useImperativeHandle } from "react"
import type { StyleProp, ViewStyle } from "react-native"
import { Pressable, StyleSheet, View } from "react-native"
import { Gesture, GestureDetector } from "react-native-gesture-handler"
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated"

import { accentColor, useColor } from "@/src/theme/colors"

export interface SliderProps {
  /**
   * The current value of the slider
   */
  value?: number

  /**
   * The minimum value of the slider
   */
  minimumValue?: number

  /**
   * The maximum value of the slider
   */
  maximumValue?: number

  /**
   * Callback that is called when the user starts sliding
   */
  onSlidingStart?: () => void

  /**
   * Callback that is called when the user stops sliding
   */
  onSlidingComplete?: (value: number) => void

  /**
   * Callback that is called when the value changes
   */
  onValueChange?: (value: number) => void

  /**
   * The width of the thumb
   */
  thumbWidth?: number

  /**
   * The height of the track
   */
  trackHeight?: number

  /**
   * Custom style for the container
   */
  style?: StyleProp<ViewStyle>

  /**
   * Whether the slider is disabled
   */
  disabled?: boolean

  /**
   * Step value for the slider
   */
  step?: number
}

export type SliderRef = {
  setValue: (value: number) => void
}

const THUMB_SIZE = 28
const TRACK_HEIGHT = 4

export const Slider = ({
  ref,
  value = 0,
  minimumValue = 0,
  maximumValue = 1,
  onSlidingStart,
  onSlidingComplete,
  onValueChange,
  thumbWidth = THUMB_SIZE,
  trackHeight = TRACK_HEIGHT,
  style,
  disabled = false,
  step,
}: SliderProps & { ref?: React.Ref<SliderRef | null> }) => {
  const trackWidth = useSharedValue(0)
  const thumbPosition = useSharedValue(0)
  const isSliding = useSharedValue(false)
  const thumbScale = useSharedValue(1)

  const activeColor = accentColor
  const inactiveColor = useColor("gray4")
  const thumbColor = "#FFFFFF"

  // Calculate thumb position based on value
  const getThumbPosition = useCallback(
    (val: number) => {
      "worklet"
      const clampedValue = Math.max(minimumValue, Math.min(maximumValue, val))
      const percentage = (clampedValue - minimumValue) / (maximumValue - minimumValue)
      return percentage * (trackWidth.value - thumbWidth)
    },
    [minimumValue, maximumValue, thumbWidth],
  )

  // Calculate value based on thumb position
  const getValue = useCallback(
    (position: number) => {
      "worklet"
      const percentage = position / (trackWidth.value - thumbWidth)
      let val = minimumValue + percentage * (maximumValue - minimumValue)

      if (step) {
        val = Math.round(val / step) * step
      }

      return Math.max(minimumValue, Math.min(maximumValue, val))
    },
    [minimumValue, maximumValue, thumbWidth, step],
  )

  // Update thumb position when value changes
  React.useEffect(() => {
    if (!isSliding.value) {
      thumbPosition.value = withSpring(getThumbPosition(value))
    }
  }, [value, getThumbPosition])

  useImperativeHandle(ref, () => ({
    setValue: (newValue: number) => {
      thumbPosition.value = withSpring(getThumbPosition(newValue))
    },
  }))

  const startPosition = useSharedValue(0)

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      if (disabled) return

      startPosition.value = thumbPosition.value
      isSliding.value = true
      thumbScale.value = withSpring(1.2, { damping: 12, stiffness: 400 })

      if (onSlidingStart) {
        runOnJS(onSlidingStart)()
      }
    })
    .onUpdate((event) => {
      if (disabled) return

      const newPosition = Math.max(
        0,
        Math.min(trackWidth.value - thumbWidth, startPosition.value + event.translationX),
      )
      thumbPosition.value = newPosition

      if (onValueChange) {
        const newValue = getValue(newPosition)
        runOnJS(onValueChange)(newValue)
      }
    })
    .onEnd(() => {
      if (disabled) return

      isSliding.value = false
      thumbScale.value = withSpring(1, { damping: 12, stiffness: 400 })

      if (onSlidingComplete) {
        const finalValue = getValue(thumbPosition.value)
        runOnJS(onSlidingComplete)(finalValue)
      }
    })

  const trackAnimatedStyle = useAnimatedStyle(() => {
    const activeWidth = thumbPosition.value + thumbWidth / 2

    return {
      width: activeWidth,
    }
  })

  const thumbAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: thumbPosition.value }, { scale: thumbScale.value }],
    }
  })

  const onTrackPress = (event: any) => {
    if (disabled) return

    const { locationX } = event.nativeEvent
    const newPosition = Math.max(
      0,
      Math.min(trackWidth.value - thumbWidth, locationX - thumbWidth / 2),
    )

    thumbPosition.value = withSpring(newPosition)

    if (onValueChange) {
      const newValue = getValue(newPosition)
      onValueChange(newValue)
    }
  }

  return (
    <View style={[styles.container, style]}>
      <Pressable
        style={[styles.trackContainer, { height: Math.max(trackHeight, thumbWidth) }]}
        onPress={onTrackPress}
        onLayout={(event) => {
          trackWidth.value = event.nativeEvent.layout.width
          thumbPosition.value = getThumbPosition(value)
        }}
      >
        {/* Background track */}
        <View
          style={[
            styles.track,
            {
              backgroundColor: inactiveColor,
              height: trackHeight,
            },
          ]}
        />

        {/* Active track */}
        <Animated.View
          style={[
            styles.activeTrack,
            {
              backgroundColor: activeColor,
              height: trackHeight,
            },
            trackAnimatedStyle,
          ]}
        />

        {/* Thumb */}
        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[
              styles.thumb,
              {
                width: thumbWidth,
                height: thumbWidth,
                backgroundColor: thumbColor,
                opacity: disabled ? 0.6 : 1,
              },
              thumbAnimatedStyle,
            ]}
          />
        </GestureDetector>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
  },
  trackContainer: {
    justifyContent: "center",
    position: "relative",
  },
  track: {
    borderRadius: 2,
    position: "absolute",
    width: "100%",
  },
  activeTrack: {
    borderRadius: 2,
    position: "absolute",
  },
  thumb: {
    borderRadius: THUMB_SIZE / 2,
    position: "absolute",
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
})

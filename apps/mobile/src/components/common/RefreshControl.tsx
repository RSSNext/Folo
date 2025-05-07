import * as React from "react"
import { StyleSheet } from "react-native"
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated"
import Svg, { Circle } from "react-native-svg"

interface CustomRefreshControlProps {
  refreshing: boolean
  pullProgress: number
}

const SIZE = 24
const STROKE_WIDTH = 2
const RADIUS = (SIZE - STROKE_WIDTH) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export function CustomRefreshControl({ refreshing, pullProgress }: CustomRefreshControlProps) {
  const rotation = useSharedValue(0)

  React.useEffect(() => {
    if (refreshing) {
      rotation.value = withRepeat(
        withTiming(360, {
          duration: 1000,
          easing: Easing.linear,
        }),
        -1, // infinite repeats
        false, // no reverse
      )
    } else {
      cancelAnimation(rotation)
      rotation.value = 0
    }
  }, [refreshing])

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    }
  })

  const strokeDashoffset = CIRCUMFERENCE * (1 - Math.max(Math.min(pullProgress - 0.2, 1), 0))

  const opacityStyle = useAnimatedStyle(() => {
    return {
      opacity: pullProgress > 0 ? 1 : 0,
    }
  })

  return (
    <Animated.View style={[styles.container, opacityStyle]}>
      <Animated.View style={[styles.circleContainer, animatedStyle]}>
        <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="rgba(161, 161, 170, 0.7)"
            strokeWidth={STROKE_WIDTH}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={refreshing ? 20 : strokeDashoffset}
            strokeLinecap="round"
          />
        </Svg>
      </Animated.View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    height: 60,
    justifyContent: "center",
    transform: [{ translateY: -60 }],
  },
  circleContainer: {
    width: SIZE,
    height: SIZE,
  },
})

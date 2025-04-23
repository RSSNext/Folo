import type { FC } from "react"
import { useEffect } from "react"
import type { StyleProp, ViewStyle } from "react-native"
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated"

import { Loading3CuteReIcon } from "@/src/icons/loading_3_cute_re"

export interface RotateableLoadingProps {
  className?: string
  style?: StyleProp<ViewStyle>
  size?: number
  color?: string
}
export const RotateableLoading: FC<RotateableLoadingProps> = ({
  size = 36,
  color = "#fff",
  className,
  style,
}) => {
  const rotate = useSharedValue(0)
  useEffect(() => {
    rotate.value = withRepeat(
      withTiming(360, { duration: 1000, easing: Easing.linear }),
      Infinity,
      false,
    )
    return () => {
      rotate.value = 0
    }
  }, [rotate])

  const rotateStyle = useAnimatedStyle(() => ({
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    transform: [{ rotate: `${rotate.value}deg` }],
  }))

  return (
    <Animated.View className={className} style={[rotateStyle, style]}>
      <Loading3CuteReIcon height={size} width={size} color={color} />
    </Animated.View>
  )
}

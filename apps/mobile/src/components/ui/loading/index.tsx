import { cn } from "@follow/utils/src/utils"
import type { FC, PropsWithChildren } from "react"
import { useEffect } from "react"
import { View } from "react-native"
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated"

import { Loading3CuteLiIcon } from "@/src/icons/loading_3_cute_li"

export const LoadingIndicator: FC<
  {
    size?: number
    color?: string
    className?: string
  } & PropsWithChildren
> = ({ size = 36, color, children, className }) => {
  const rotateValue = useSharedValue(0)

  const rotation = useDerivedValue(() => {
    return interpolate(rotateValue.value, [0, 360], [0, 360])
  })

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }))
  useEffect(() => {
    rotateValue.value = withRepeat(
      withTiming(360, { duration: 1000, easing: Easing.linear }),
      -1,
      false,
    )

    return () => {
      rotateValue.value = 0
    }
  }, [rotateValue])
  return (
    <View className={cn("flex-1 items-center justify-center", className)}>
      <Animated.View style={[animatedStyle, { width: size, height: size }]} className={"mb-2"}>
        <Loading3CuteLiIcon width={size} height={size} color={color} />
      </Animated.View>
      {children}
    </View>
  )
}

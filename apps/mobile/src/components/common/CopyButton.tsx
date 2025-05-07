import { cn } from "@follow/utils/src/utils"
import { useRef } from "react"
import { Pressable } from "react-native"
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated"
import { useEventCallback } from "usehooks-ts"

import { CheckFilledIcon } from "@/src/icons/check_filled"
import { Copy2CuteReIcon } from "@/src/icons/copy_2_cute_re"
import { useColor } from "@/src/theme/colors"

type Size = "sm" | "md" | "tiny"
interface CopyButtonProps {
  onCopy: () => void
  className?: string
  size?: Size
}

const sizeClassNames = {
  tiny: "size-6",
  sm: "size-8",
  md: "size-10",
}

const sizeIconSize = {
  tiny: 14,
  sm: 18,
  md: 20,
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)
export const CopyButton = ({ onCopy, className, size = "sm" }: CopyButtonProps) => {
  const initialIconScale = useSharedValue(1)
  const pressedIconScale = useSharedValue(0)
  const initialStyle = useAnimatedStyle(() => ({
    transform: [{ scale: initialIconScale.value }],
  }))

  const initialBgColor = useColor("gray3")
  const pressedBgColor = useColor("green")

  const pressedStyle = useAnimatedStyle(() => ({
    position: "absolute",
    transform: [{ scale: pressedIconScale.value }],
  }))

  const wrapperStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      pressedIconScale.value,
      [0, 1],
      [initialBgColor, pressedBgColor],
    ),
  }))

  const animatedProgressingRef = useRef(false)
  const handlePress = useEventCallback(() => {
    onCopy()

    if (animatedProgressingRef.current) return
    animatedProgressingRef.current = true
    initialIconScale.value = withTiming(0, { duration: 100 }, () => {
      pressedIconScale.value = withTiming(1, { duration: 100 }, () => {
        pressedIconScale.value = withDelay(
          1000,
          withTiming(0, { duration: 100 }, () => {
            initialIconScale.value = withTiming(1, { duration: 100 })
          }),
        )
      })
    })

    setTimeout(
      () => {
        animatedProgressingRef.current = false
      },
      100 + 100 + 1000 + 100 + 100,
    )
  })
  return (
    <AnimatedPressable
      hitSlop={10}
      style={wrapperStyle}
      className={cn(
        "bg-gray-4 items-center justify-center rounded-lg",
        sizeClassNames[size],
        className,
      )}
      onPress={handlePress}
    >
      <Animated.View style={initialStyle}>
        <Copy2CuteReIcon color="#fff" height={sizeIconSize[size]} width={sizeIconSize[size]} />
      </Animated.View>
      <Animated.View style={pressedStyle}>
        <CheckFilledIcon color="#fff" height={sizeIconSize[size]} width={sizeIconSize[size]} />
      </Animated.View>
    </AnimatedPressable>
  )
}

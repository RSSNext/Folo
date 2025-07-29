import { cn } from "@follow/utils"
import { useEffect } from "react"
import type { PressableProps } from "react-native"
import Animated, {
  cancelAnimation,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated"
import { useColor } from "react-native-uikit-colors"

import { accentColor } from "@/src/theme/colors"

import { PlatformActivityIndicator } from "../ui/loading/PlatformActivityIndicator"
import { ReAnimatedPressable } from "./AnimatedComponents"

export function SubmitButton({
  isLoading,
  title,
  ...props
}: PressableProps & { isLoading?: boolean; title: string }) {
  const disabled = props.disabled || isLoading
  const disableColor = useColor("gray6")
  const disabledTextColor = useColor("gray2")

  const disabledValue = useSharedValue(1)
  useEffect(() => {
    cancelAnimation(disabledValue)
    disabledValue.value = withTiming(disabled ? 1 : 0)
  }, [disabled])

  const buttonStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(disabledValue.value, [1, 0], [disableColor, accentColor]),
  }))

  const textStyle = useAnimatedStyle(() => ({
    color: interpolateColor(disabledValue.value, [1, 0], [disabledTextColor, "white"]),
  }))

  return (
    <ReAnimatedPressable
      {...props}
      disabled={disabled}
      style={[buttonStyle, props.style]}
      className={cn(
        "flex h-[48] flex-row items-center justify-center rounded-2xl",
        props.className,
      )}
    >
      {isLoading ? (
        <PlatformActivityIndicator color="white" />
      ) : (
        <Animated.Text className="text-center text-xl font-semibold" style={textStyle}>
          {title}
        </Animated.Text>
      )}
    </ReAnimatedPressable>
  )
}

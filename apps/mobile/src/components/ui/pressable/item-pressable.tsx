import { useTypeScriptHappyCallback } from "@follow/hooks"
import { cn, composeEventHandlers } from "@follow/utils"
import { Fragment, memo, useEffect, useState } from "react"
import type { Pressable } from "react-native"
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated"

import { useColor } from "@/src/theme/colors"

import { ReAnimatedPressable } from "../../common/AnimatedComponents"

export const ItemPressable: typeof Pressable = memo(({ children, ...props }) => {
  const [isPressing, setIsPressing] = useState(false)

  const secondarySystemGroupedBackground = useColor("secondarySystemGroupedBackground")

  const systemFill = useColor("systemFill")
  const pressed = useSharedValue(0)

  useEffect(() => {
    if (isPressing) {
      pressed.value = 1
    } else {
      pressed.value = withTiming(0, {
        duration: 300,
        easing: Easing.ease,
      })
    }
  }, [isPressing, pressed])

  const colorStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: interpolateColor(
        pressed.value,
        [0, 1],
        [secondarySystemGroupedBackground, systemFill],
      ),
    }
  })
  return (
    <ReAnimatedPressable
      {...props}
      onPressIn={composeEventHandlers(props.onPressIn, () => setIsPressing(true))}
      onPressOut={composeEventHandlers(props.onPressOut, () => setIsPressing(false))}
      onHoverIn={composeEventHandlers(props.onHoverIn, () => setIsPressing(true))}
      onHoverOut={composeEventHandlers(props.onHoverOut, () => setIsPressing(false))}
      className={cn(props.className, "bg-secondary-system-background relative")}
      style={props.style}
    >
      {useTypeScriptHappyCallback(
        (props) => {
          return (
            <Fragment>
              <Animated.View className="absolute inset-0" style={colorStyle} />
              {typeof children === "function" ? children(props) : children}
            </Fragment>
          )
        },
        [children, colorStyle],
      )}
    </ReAnimatedPressable>
  )
})

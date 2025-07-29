import { useTypeScriptHappyCallback } from "@follow/hooks"
import { cn, composeEventHandlers } from "@follow/utils"
import type { FC } from "react"
import { Fragment, memo } from "react"
import type { PressableProps } from "react-native"
import { StyleSheet } from "react-native"
import Animated, {
  cancelAnimation,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from "react-native-reanimated"

import { gentleSpringPreset } from "@/src/constants/spring"
import { useColor } from "@/src/theme/colors"

import { ReAnimatedPressable } from "../../common/AnimatedComponents"
import { ItemPressableStyle } from "./enum"

export interface ItemPressableProps extends PressableProps {
  itemStyle?: ItemPressableStyle
  touchHighlight?: boolean
}

export const ItemPressable: FC<ItemPressableProps> = memo(
  ({ children, itemStyle = ItemPressableStyle.Grouped, touchHighlight = true, ...props }) => {
    const secondarySystemGroupedBackground = useColor("secondarySystemGroupedBackground")
    const plainBackground = useColor("systemBackground")

    const itemNormalColor =
      itemStyle === ItemPressableStyle.Plain ? plainBackground : secondarySystemGroupedBackground

    const systemFill = useColor("systemFill")
    const pressed = useSharedValue(0)

    const colorStyle = useAnimatedStyle(() => {
      return {
        backgroundColor: interpolateColor(pressed.value, [0, 1], [itemNormalColor, systemFill]),
      }
    })

    const isUnStyled = itemStyle === ItemPressableStyle.UnStyled

    return (
      <ReAnimatedPressable
        {...props}
        onPress={composeEventHandlers(props.onPress, () => {
          cancelAnimation(pressed)
          pressed.value = withSequence(
            withSpring(1, { duration: 0.2 }),
            withSpring(0, gentleSpringPreset),
          )
        })}
        // This is a workaround to prevent context menu crash when release too quickly
        // https://github.com/nandorojo/zeego/issues/61
        onLongPress={composeEventHandlers(props.onLongPress, () => {})}
        delayLongPress={props.delayLongPress ?? 100}
        className={cn("relative overflow-hidden", props.className)}
        style={StyleSheet.flatten([
          props.style,
          !isUnStyled && { backgroundColor: itemNormalColor },
        ])}
      >
        {useTypeScriptHappyCallback(
          (props) => {
            return (
              <Fragment>
                {touchHighlight && (
                  <Animated.View className="absolute inset-0" style={colorStyle} />
                )}
                {typeof children === "function" ? children(props) : children}
              </Fragment>
            )
          },
          [children, colorStyle],
        )}
      </ReAnimatedPressable>
    )
  },
)

import { cn } from "@follow/utils"
import { requireNativeView } from "expo"
import { cssInterop } from "nativewind"
import type { FC } from "react"
import { memo } from "react"
import type { ViewProps } from "react-native"

import { ItemPressableStyle } from "./enum"

export interface ItemPressableProps extends ViewProps {
  itemStyle?: ItemPressableStyle
  touchHighlight?: boolean
  onPress?: () => any
}
const NativeItemPressable = requireNativeView<
  ViewProps & {
    onItemPress: () => any
    touchHighlight?: boolean
  }
>("ItemPressable")
cssInterop(NativeItemPressable, {
  className: "style",
})

export const ItemPressable: FC<ItemPressableProps> = memo(
  ({ children, itemStyle = ItemPressableStyle.Grouped, className, ...props }) => {
    const isUnStyled = itemStyle === ItemPressableStyle.UnStyled
    return (
      <NativeItemPressable
        {...props}
        className={
          isUnStyled
            ? className
            : cn(
                "relative overflow-hidden",

                itemStyle === ItemPressableStyle.Plain
                  ? "bg-system-background"
                  : "bg-secondary-system-grouped-background",
                className,
              )
        }
        touchHighlight={props.touchHighlight ?? true}
        onItemPress={() => {
          props.onPress?.()
        }}
      >
        {children}
      </NativeItemPressable>
    )
  },
)

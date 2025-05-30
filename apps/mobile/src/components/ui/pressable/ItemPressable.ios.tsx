import { cn } from "@follow/utils"
import type { FC } from "react"
import { memo } from "react"
import type { ViewProps } from "react-native"

import { ItemPressableStyle } from "./enum"
import { NativeItemPressable } from "./IosItemPressable"

export interface ItemPressableProps extends ViewProps {
  itemStyle?: ItemPressableStyle
  touchHighlight?: boolean
  onPress?: () => any
}

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

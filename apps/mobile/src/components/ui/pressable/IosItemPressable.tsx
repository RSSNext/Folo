import type { FC } from "react"
import type { ViewProps } from "react-native"

const NativeItemPressable: FC<
  ViewProps & {
    onItemPress?: () => any
    touchHighlight?: boolean
  }
> = () => {
  throw new Error("NativeItemPressable is not supported on iOS")
}
export { NativeItemPressable }

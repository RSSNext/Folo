import { requireNativeView } from "expo"
import { cssInterop } from "nativewind"
import type { ViewProps } from "react-native"

const NativeItemPressable = requireNativeView<
  ViewProps & {
    onItemPress?: () => any
    touchHighlight?: boolean
  }
>("ItemPressable")
cssInterop(NativeItemPressable, {
  className: "style",
})
export { NativeItemPressable }

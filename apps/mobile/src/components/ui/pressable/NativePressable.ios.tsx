import { NativeItemPressable } from "./IosItemPressable"
import type { NativePressableProps } from "./NativePressable.types"

export const NativePressable = ({ children, onPress, ...props }: NativePressableProps) => {
  return (
    <NativeItemPressable touchHighlight={false} onItemPress={onPress} {...props}>
      {children}
    </NativeItemPressable>
  )
}

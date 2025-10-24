import { View } from "react-native"

const el = (
  <View className="bg-system-background">
    <View
      className="ml-4 h-px bg-opaque-separator/70"
      style={{ transform: [{ scaleY: 0.5 }] }}
      collapsable={false}
    />
  </View>
)

export const ItemSeparator = () => {
  return el
}
const el2 = (
  <View className="bg-system-background">
    <View
      className="h-px w-full bg-opaque-separator/70"
      style={{ transform: [{ scaleY: 0.5 }] }}
      collapsable={false}
    />
  </View>
)
export const ItemSeparatorFullWidth = () => {
  return el2
}

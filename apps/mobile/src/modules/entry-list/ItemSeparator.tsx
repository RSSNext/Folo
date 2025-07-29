import { View } from "react-native"

const el = (
  <View className="bg-system-background">
    <View
      className="bg-opaque-separator/70 ml-4 h-px"
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
      className="bg-opaque-separator/70 h-px w-full"
      style={{ transform: [{ scaleY: 0.5 }] }}
      collapsable={false}
    />
  </View>
)
export const ItemSeparatorFullWidth = () => {
  return el2
}

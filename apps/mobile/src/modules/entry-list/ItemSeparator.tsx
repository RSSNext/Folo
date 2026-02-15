import { View } from "react-native"

export const ItemSeparator = () => {
  return (
    <View className="bg-system-background">
      <View className="ml-4 h-px bg-opaque-separator/70" collapsable={false} />
    </View>
  )
}

export const ItemSeparatorFullWidth = () => {
  return (
    <View className="bg-system-background">
      <View className="h-px w-full bg-opaque-separator/70" collapsable={false} />
    </View>
  )
}

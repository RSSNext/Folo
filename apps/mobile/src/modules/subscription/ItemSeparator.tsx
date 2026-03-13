import { View } from "react-native"

import { GROUPED_LIST_MARGIN } from "@/src/components/ui/grouped/constants"
import { useReadableContainerStyle } from "@/src/lib/responsive"

export const ItemSeparator = () => {
  const readableContainerStyle = useReadableContainerStyle(760, GROUPED_LIST_MARGIN)
  return (
    <View
      className="bg-secondary-system-grouped-background"
      style={[readableContainerStyle, { marginHorizontal: GROUPED_LIST_MARGIN }]}
    >
      <View
        className="ml-12 h-px flex-1 bg-opaque-separator/70"
        collapsable={false}
        style={{ transform: [{ scaleY: 0.5 }] }}
      />
    </View>
  )
}

export const SecondaryItemSeparator = () => {
  const readableContainerStyle = useReadableContainerStyle(760, GROUPED_LIST_MARGIN)
  return (
    <View
      className="bg-secondary-system-grouped-background"
      style={[readableContainerStyle, { marginHorizontal: GROUPED_LIST_MARGIN }]}
    >
      <View
        className="ml-16 h-px flex-1 bg-opaque-separator/70"
        collapsable={false}
        style={{ transform: [{ scaleY: 0.5 }] }}
      />
    </View>
  )
}

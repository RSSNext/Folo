import { View } from "react-native"

import { GROUPED_LIST_MARGIN } from "@/src/components/ui/grouped/constants"

const el = (
  <View
    className="bg-secondary-system-grouped-background"
    style={{ marginHorizontal: GROUPED_LIST_MARGIN }}
  >
    <View
      className="bg-opaque-separator/70 ml-12 h-px flex-1"
      collapsable={false}
      style={{ transform: [{ scaleY: 0.5 }] }}
    />
  </View>
)
export const ItemSeparator = () => {
  return el
}

const el2 = (
  <View
    className="bg-secondary-system-grouped-background"
    style={{ marginHorizontal: GROUPED_LIST_MARGIN }}
  >
    <View
      className="bg-opaque-separator/70 ml-16 h-px flex-1"
      collapsable={false}
      style={{ transform: [{ scaleY: 0.5 }] }}
    />
  </View>
)
export const SecondaryItemSeparator = () => {
  return el2
}

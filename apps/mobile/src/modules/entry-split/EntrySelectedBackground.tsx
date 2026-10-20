import { View } from "react-native"

/** Marks the row of the entry that the reader next to the list shows */
export const EntrySelectedBackground = () => (
  <View
    pointerEvents="none"
    className="absolute inset-x-2 inset-y-1 rounded-xl bg-secondary-system-fill"
  />
)

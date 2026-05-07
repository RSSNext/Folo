import { getScrollMarkReadEndPadding } from "@follow/shared/scroll-mark-read"
import { useMemo } from "react"
import { useWindowDimensions, View } from "react-native"

export const EntryListEndScrollSpacer = () => {
  const { height } = useWindowDimensions()
  const style = useMemo(() => ({ height: getScrollMarkReadEndPadding(height) }), [height])

  return <View pointerEvents="none" style={style} />
}

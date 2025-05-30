import type { ViewStyle } from "react-native"

export type GaleriaViewProps = {
  index?: number
  id?: string
  children: React.ReactElement
  style?: ViewStyle
  dynamicAspectRatio?: boolean
  onPreview?: (e: { nativeEvent: { index: number } }) => void
  onClosePreview?: (e: { nativeEvent: never }) => void
  onIndexChange?: (e: { nativeEvent: { index: number } }) => void
}

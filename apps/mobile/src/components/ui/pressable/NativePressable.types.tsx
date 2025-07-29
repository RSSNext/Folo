import type { ViewProps } from "react-native"

export interface NativePressableProps extends ViewProps {
  onPress?: () => any
}

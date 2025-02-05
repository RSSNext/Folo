// https://github.com/react-navigation/react-navigation/blob/main/packages/native-stack/src/views/NativeStackView.native.tsx

import { getDefaultHeaderHeight } from "@react-navigation/elements"
import { Platform } from "react-native"
import { useSafeAreaFrame, useSafeAreaInsets } from "react-native-safe-area-context"

export const useDefaultHeaderHeight = () => {
  const insets = useSafeAreaInsets()
  const frame = useSafeAreaFrame()

  const isIPhone = Platform.OS === "ios" && !(Platform.isPad || Platform.isTV)
  const isLandscape = frame.width > frame.height
  const topInset = isIPhone && isLandscape ? 0 : insets.top
  const ANDROID_DEFAULT_HEADER_HEIGHT = 56

  const defaultHeaderHeight = Platform.select({
    android: ANDROID_DEFAULT_HEADER_HEIGHT + topInset,
    default: getDefaultHeaderHeight(frame, false, topInset),
  })

  return defaultHeaderHeight
}

import * as ExpoHaptics from "expo-haptics"
import { Vibration } from "react-native"

import { getUISettings } from "@/src/atoms/settings/ui"

export { ImpactFeedbackStyle, NotificationFeedbackType } from "expo-haptics"

/**
 * Every haptic the app plays goes through here, so the haptic feedback setting turns all of
 * them off. A setting saved before it existed reads as on.
 */
const isHapticFeedbackEnabled = () => getUISettings().hapticFeedback !== false

export const impactAsync = async (style?: ExpoHaptics.ImpactFeedbackStyle) => {
  if (!isHapticFeedbackEnabled()) return
  await ExpoHaptics.impactAsync(style)
}

export const notificationAsync = async (type?: ExpoHaptics.NotificationFeedbackType) => {
  if (!isHapticFeedbackEnabled()) return
  await ExpoHaptics.notificationAsync(type)
}

export const selectionAsync = async () => {
  if (!isHapticFeedbackEnabled()) return
  await ExpoHaptics.selectionAsync()
}

export const vibrate = (duration: number) => {
  if (!isHapticFeedbackEnabled()) return
  Vibration.vibrate(duration)
}

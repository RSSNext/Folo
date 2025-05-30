import * as Notifications from "expo-notifications"
import { Platform } from "react-native"

import { getUISettings } from "../atoms/settings/ui"
import { toast } from "./toast"

export async function requestNotificationPermission() {
  if (Platform.OS === "android") {
    Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    })
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }
  if (finalStatus !== "granted") {
    toast.error("Permission not granted for notification!")
    return false
  }
  return true
}

export async function setBadgeCountAsyncWithPermission(
  badgeCount: number,
  skipSettingCheck = false,
) {
  const { showUnreadCountBadgeMobile } = getUISettings()
  if (!showUnreadCountBadgeMobile && !skipSettingCheck) {
    return false
  }

  const permissionGranted = await requestNotificationPermission()
  if (!permissionGranted) {
    return false
  }

  const currentBadgeCount = await Notifications.getBadgeCountAsync()
  if (badgeCount === currentBadgeCount) {
    return false
  }

  return await Notifications.setBadgeCountAsync(badgeCount)
}

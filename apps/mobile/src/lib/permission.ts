import * as Notifications from "expo-notifications"
import { t } from "i18next"
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
    toast.error(t("permission.notification_denied"))
    return false
  }
  return true
}

export async function setBadgeCountAsyncWithPermission(
  badgeCount: number,
  {
    skipSettingCheck = false,
    requestPermission = false,
  }: {
    skipSettingCheck?: boolean
    /** Only a user action should prompt; background updates just check the current status */
    requestPermission?: boolean
  } = {},
) {
  const { showUnreadCountBadgeMobile } = getUISettings()
  if (!showUnreadCountBadgeMobile && !skipSettingCheck) {
    return false
  }

  const permissionGranted = requestPermission
    ? await requestNotificationPermission()
    : (await Notifications.getPermissionsAsync()).status === "granted"
  if (!permissionGranted) {
    return false
  }

  const currentBadgeCount = await Notifications.getBadgeCountAsync()
  if (badgeCount === currentBadgeCount) {
    return false
  }

  return await Notifications.setBadgeCountAsync(badgeCount)
}

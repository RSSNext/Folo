import messaging from "@react-native-firebase/messaging"
import * as Device from "expo-device"
import * as Notifications from "expo-notifications"
import { Platform } from "react-native"

import { apiClient } from "../lib/api-fetch"
import { toast } from "../lib/toast"
import { whoami } from "../store/user/getters"

function handleRegistrationError(message: string) {
  toast.error(message)
}

async function registerForPushNotificationsAsync() {
  if (Platform.OS === "android") {
    Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    })
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }
    if (finalStatus !== "granted") {
      handleRegistrationError("Permission not granted to get push token for push notification!")
      return
    }
  } else {
    handleRegistrationError("Must use physical device for push notifications")
  }
}

export const initMessaging = () => {
  const user = whoami()
  if (!user) {
    return
  }
  messaging()
    .getToken()
    .then((token) => {
      apiClient.messaging.$post({
        json: {
          token,
          channel: "mobile",
        },
      })
    })
  registerForPushNotificationsAsync()
}

import messaging from "@react-native-firebase/messaging"

import { apiClient } from "../lib/api-fetch"
import { kv } from "../lib/kv"
import { requestNotificationPermission } from "../lib/permission"
import { whoami } from "../store/user/getters"

const FIREBASE_MESSAGING_TOKEN_STORAGE_KEY = "firebase_messaging_token"

async function saveMessagingToken() {
  const token = await messaging().getToken()
  const storedToken = await kv.get(FIREBASE_MESSAGING_TOKEN_STORAGE_KEY)
  if (storedToken === token) {
    return
  }
  await apiClient.messaging.$post({
    json: {
      token,
      channel: "mobile",
    },
  })
  kv.set(FIREBASE_MESSAGING_TOKEN_STORAGE_KEY, token)
}

export const initMessaging = () => {
  const user = whoami()
  if (!user) {
    return
  }

  saveMessagingToken()
  requestNotificationPermission()
}

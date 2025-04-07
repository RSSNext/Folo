import messaging from "@react-native-firebase/messaging"

import { apiClient } from "../lib/api-fetch"
import { requestNotificationPermission } from "../lib/permission"
import { whoami } from "../store/user/getters"

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
  requestNotificationPermission()
}

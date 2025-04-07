import messaging from "@react-native-firebase/messaging"

import { apiClient } from "../lib/api-fetch"
import { requestNotificationPermission } from "../lib/permission"
import { whoami } from "../store/user/getters"

export const initMessaging = () => {
  messaging()
    .getToken()
    .then((token) => {
      const user = whoami()
      if (!user) {
        return
      }
      apiClient.messaging.$post({
        json: {
          token,
          channel: "mobile",
        },
      })
    })

  requestNotificationPermission()
}

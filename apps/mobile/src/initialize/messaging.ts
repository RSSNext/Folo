import type { FirebaseMessagingTypes } from "@react-native-firebase/messaging"
import messaging from "@react-native-firebase/messaging"
import { useEffect } from "react"
import { Platform } from "react-native"

import { apiClient } from "../lib/api-fetch"
import { kv } from "../lib/kv"
import { useNavigation } from "../lib/navigation/hooks"
import { requestNotificationPermission } from "../lib/permission"
import { EntryDetailScreen } from "../screens/(stack)/entries/[entryId]"
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
      channel: Platform.OS,
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

export function useMessaging() {
  const navigation = useNavigation()
  useEffect(() => {
    function navigateToEntry(message: FirebaseMessagingTypes.RemoteMessage) {
      if (
        !message.data ||
        typeof message.data.view !== "string" ||
        typeof message.data.entryId !== "string"
      ) {
        return
      }

      navigation.pushControllerView(EntryDetailScreen, {
        entryId: message.data.entryId,
        view: Number.parseInt(message.data.view),
      })
    }

    async function init() {
      const message = await messaging().getInitialNotification()
      if (message) {
        navigateToEntry(message)
      }
    }

    init()

    const unsubscribe = messaging().onNotificationOpenedApp((remoteMessage) => {
      navigateToEntry(remoteMessage)
    })

    return () => {
      unsubscribe()
    }
  }, [navigation])
}

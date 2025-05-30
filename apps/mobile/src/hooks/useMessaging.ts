import { useHasNotificationActions } from "@follow/store/action/hooks"
import { useWhoami } from "@follow/store/user/hooks"
import { getApp } from "@react-native-firebase/app"
import type { FirebaseMessagingTypes } from "@react-native-firebase/messaging"
import { getMessaging } from "@react-native-firebase/messaging"
import { useMutation } from "@tanstack/react-query"
import { useEffect } from "react"
import { Platform } from "react-native"

import { apiClient } from "@/src/lib/api-fetch"
import { kv } from "@/src/lib/kv"
import { useNavigation } from "@/src/lib/navigation/hooks"
import { requestNotificationPermission } from "@/src/lib/permission"
import { EntryDetailScreen } from "@/src/screens/(stack)/entries/[entryId]/EntryDetailScreen"

const FIREBASE_MESSAGING_TOKEN_STORAGE_KEY = "firebase_messaging_token"

async function saveMessagingToken() {
  const app = getApp()
  const token = await getMessaging(app).getToken()
  await apiClient.messaging.$post({
    json: {
      token,
      channel: Platform.OS,
    },
  })
  kv.set(FIREBASE_MESSAGING_TOKEN_STORAGE_KEY, token)
}

export function useUpdateMessagingToken() {
  const whoami = useWhoami()
  const hasNotificationActions = useHasNotificationActions()
  const { mutate } = useMutation({
    mutationFn: async () => {
      return Promise.all([saveMessagingToken(), requestNotificationPermission()])
    },
  })

  useEffect(() => {
    if (!whoami?.id || !hasNotificationActions) return
    mutate()
  }, [hasNotificationActions, mutate, whoami?.id])
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

    const app = getApp()
    async function init() {
      const message = await getMessaging(app).getInitialNotification()
      if (message) {
        navigateToEntry(message)
      }
    }

    init()

    const unsubscribe = getMessaging(app).onNotificationOpenedApp((remoteMessage) => {
      navigateToEntry(remoteMessage)
    })

    return () => {
      unsubscribe()
    }
  }, [navigation])
}

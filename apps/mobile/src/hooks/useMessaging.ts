import { useHasNotificationActions } from "@follow/store/action/hooks"
import { ROUTE_FEED_IN_INBOX } from "@follow/store/constants/app"
import { useWhoami } from "@follow/store/user/hooks"
import { tracker } from "@follow/tracker"
import { getApp } from "@react-native-firebase/app"
import type { RemoteMessage } from "@react-native-firebase/messaging"
import {
  getAPNSToken,
  getInitialNotification,
  getMessaging,
  getToken,
  onNotificationOpenedApp,
  onTokenRefresh,
  registerDeviceForRemoteMessages,
} from "@react-native-firebase/messaging"
import { useMutation } from "@tanstack/react-query"
import { useEffect } from "react"
import { Platform } from "react-native"

import { followClient } from "@/src/lib/api-client"
import { kv } from "@/src/lib/kv"
import {
  registerMessagingToken,
  shouldRetryMessagingTokenRegistration,
} from "@/src/lib/messaging-registration"
import { useNavigation } from "@/src/lib/navigation/hooks"
import { requestNotificationPermission } from "@/src/lib/permission"
import { EntryDetailScreen } from "@/src/screens/(stack)/entries/[entryId]/EntryDetailScreen"

const FIREBASE_MESSAGING_TOKEN_STORAGE_KEY = "firebase_messaging_token"

async function saveMessagingToken(token: string) {
  await followClient.api.messaging.createToken({ token, channel: Platform.OS })
  kv.set(FIREBASE_MESSAGING_TOKEN_STORAGE_KEY, token)
}

export function useUpdateMessagingToken() {
  const whoami = useWhoami()
  const hasNotificationActions = useHasNotificationActions()
  const { mutate } = useMutation({
    scope: { id: "mobile-push-token-registration" },
    mutationFn: async ({ token }: { token?: string }) => {
      if (token) {
        await saveMessagingToken(token)
        return token
      }

      const messaging = getMessaging(getApp())
      return registerMessagingToken({
        platform: Platform.OS,
        requestPermission: requestNotificationPermission,
        registerDeviceForRemoteMessages: () => registerDeviceForRemoteMessages(messaging),
        getAPNSToken: () => getAPNSToken(messaging),
        getToken: () => getToken(messaging),
        saveToken: saveMessagingToken,
      })
    },
    retry: shouldRetryMessagingTokenRegistration,
    retryDelay: (attemptIndex) => Math.min(500 * 2 ** attemptIndex, 4_000),
    onError: (error) => {
      console.error("Failed to register push notifications", error)
      void tracker.manager.captureException(error, {
        module: "push_notifications",
        stage: "token_registration",
        platform: Platform.OS,
      })
    },
  })

  useEffect(() => {
    if (!whoami?.id || !hasNotificationActions) return

    const messaging = getMessaging(getApp())
    const unsubscribe = onTokenRefresh(messaging, (token) => {
      mutate({ token })
    })

    mutate({})
    return unsubscribe
  }, [hasNotificationActions, mutate, whoami?.id])
}

export function useMessaging() {
  const navigation = useNavigation()
  useEffect(() => {
    function navigateToEntry(message: RemoteMessage) {
      if (
        !message.data ||
        message.data.type !== "new-entry" ||
        typeof message.data.view !== "string" ||
        typeof message.data.entryId !== "string"
      ) {
        return
      }

      navigation.pushControllerView(EntryDetailScreen, {
        entryId: message.data.entryId,
        view: Number.parseInt(message.data.view),
        isInbox: String(message.data.feedId).startsWith(ROUTE_FEED_IN_INBOX),
      })
    }

    const app = getApp()
    async function init() {
      const message = await getInitialNotification(getMessaging(app))
      if (message) {
        navigateToEntry(message)
      }
    }

    init()

    const unsubscribe = onNotificationOpenedApp(getMessaging(app), (remoteMessage) => {
      navigateToEntry(remoteMessage)
    })

    return () => {
      unsubscribe()
    }
  }, [navigation])
}

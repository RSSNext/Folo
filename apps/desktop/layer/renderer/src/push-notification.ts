import { env } from "@follow/shared/env.desktop"
import { actionSyncService, useActionStore } from "@follow/store/action/store"
import { whoami } from "@follow/store/user/getters"
import { initializeApp } from "firebase/app"
import { getMessaging, getToken } from "firebase/messaging"

import { setAppMessagingToken } from "./atoms/app"
import { followClient } from "./lib/api-client"
import {
  isWebPushRegistrationCurrent,
  rememberWebPushRegistration,
  WEB_PUSH_CHANNEL,
} from "./lib/web-push-registration"
import { router } from "./router"

const firebaseConfig = env.VITE_FIREBASE_CONFIG ? JSON.parse(env.VITE_FIREBASE_CONFIG) : null

export async function registerWebPushNotifications() {
  if (!firebaseConfig) {
    return
  }
  try {
    const user = whoami()
    if (!user) {
      return
    }
    // Waits for the sync engine to catch up. With it running, the rules come from the local
    // database and the change log instead of a request on every launch.
    await actionSyncService.ensureRules()
    const hasPushNotificationRule = useActionStore
      .getState()
      .rules.some((rule) => rule.result.newEntryNotification && !rule.result.disabled)
    if (!hasPushNotificationRule) {
      return
    }

    const existingRegistration = await navigator.serviceWorker.getRegistration()
    const registration = existingRegistration

    if (!registration) {
      return
    }

    await navigator.serviceWorker.ready

    const app = initializeApp(firebaseConfig)
    const messaging = getMessaging(app)

    const permission = await Notification.requestPermission()
    if (permission !== "granted") {
      throw new Error("Notification permission denied")
    }

    // get FCM token
    const token = await getToken(messaging, {
      serviceWorkerRegistration: registration,
    })

    // Registering again is only needed when the token changed or another browser took over
    // the channel since this one registered.
    if (!isWebPushRegistrationCurrent(user.id, token)) {
      const response = await followClient.api.messaging.createToken({
        token,
        channel: WEB_PUSH_CHANNEL,
      })
      rememberWebPushRegistration({ userId: user.id, token, syncId: response.lastSyncId })
    }

    registerPushNotificationPostMessage()

    setAppMessagingToken(token)

    return token
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Failed to register push notifications: ${error.message}`)
    }
  }
}

interface NavigateEntryMessage {
  type: "NOTIFICATION_CLICK"
  action: "NAVIGATE_ENTRY"
  data: {
    feedId: string
    entryId: string
    view: number
    url: string
  }
}

type ServiceWorkerMessage = NavigateEntryMessage

const registerPushNotificationPostMessage = () => {
  navigator.serviceWorker.addEventListener("message", (event) => {
    const message = event.data as ServiceWorkerMessage

    if (message.type === "NOTIFICATION_CLICK") {
      switch (message.action) {
        case "NAVIGATE_ENTRY": {
          router.navigate(message.data.url)
          break
        }
      }
    }
  })
}

import { env } from "@follow/shared/env.desktop"
import { getApp } from "firebase/app"
import { getMessaging, getToken } from "firebase/messaging"

import { setAppMessagingToken } from "./atoms/app"
import { apiClient } from "./lib/api-fetch"
import { router } from "./router"

const firebaseConfig = env.VITE_FIREBASE_CONFIG ? JSON.parse(env.VITE_FIREBASE_CONFIG) : null

export async function registerWebPushNotifications() {
  if (!firebaseConfig) {
    return
  }
  try {
    const actions = await apiClient.actions.$get()
    const rules = actions.data?.rules
    const hasPushNotificationRule = rules?.some(
      (rule) => rule.result.newEntryNotification && !rule.result.disabled,
    )
    if (!hasPushNotificationRule) {
      return
    }

    const existingRegistration = await navigator.serviceWorker.getRegistration()
    const registration = existingRegistration

    if (!registration) {
      return
    }

    await navigator.serviceWorker.ready

    const app = getApp()
    const messaging = getMessaging(app)

    const permission = await Notification.requestPermission()
    if (permission !== "granted") {
      throw new Error("Notification permission denied")
    }

    // get FCM token
    const token = await getToken(messaging, {
      serviceWorkerRegistration: registration,
    })

    await apiClient.messaging.$post({
      json: {
        token,
        channel: "web",
      },
    })

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

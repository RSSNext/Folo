import { env } from "@follow/shared/env.desktop"
import { initializeApp } from "firebase/app"
import { getMessaging, getToken } from "firebase/messaging"

import { apiClient } from "./lib/api-fetch"
import { router } from "./router"

const firebaseConfig = env.VITE_FIREBASE_CONFIG ? JSON.parse(env.VITE_FIREBASE_CONFIG) : null

export async function registerWebPushNotifications() {
  if (!firebaseConfig) {
    return
  }
  try {
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

    await apiClient.messaging.$post({
      json: {
        token,
        channel: "web",
      },
    })

    registerPushNotificationPostMessage()

    return token
  } catch (error) {
    if (error instanceof Error) {
      throw new TypeError(`Failed to register push notifications: ${error.message}`)
    }
    throw error
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

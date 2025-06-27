import { IN_ELECTRON } from "@follow/shared/constants"
import { env } from "@follow/shared/env.desktop"
import type { AuthSession } from "@follow/shared/hono"
import {
  setFirebaseTracker,
  setOpenPanelTracker,
  setPostHogTracker,
  tracker,
} from "@follow/tracker"
import { getAnalytics, logEvent, setUserId, setUserProperties } from "firebase/analytics"
import { initializeApp } from "firebase/app"
import posthog from "posthog-js"

import { QUERY_PERSIST_KEY } from "~/constants/app"
import { ipcServices } from "~/lib/client"

import { op } from "./op"

const firebaseConfig = env.VITE_FIREBASE_CONFIG ? JSON.parse(env.VITE_FIREBASE_CONFIG) : null

export const initAnalytics = async () => {
  tracker.manager.appendUserProperties({
    build: ELECTRON ? "electron" : "web",
    version: APP_VERSION,
    hash: GIT_COMMIT_SHA,
    language: navigator.language,
  })

  if (IN_ELECTRON) {
    const firebaseTracker = {
      logEvent: async (name: string, params: Record<string, any>) => {
        return ipcServices?.ga4.logEvent({ name, params })
      },
      setUserId: async (id: string) => {
        return ipcServices?.ga4.setUserId({ id })
      },
      setUserProperties: async (properties: Record<string, any>) => {
        return ipcServices?.ga4.setUserProperties({ properties })
      },
    }
    setFirebaseTracker(firebaseTracker)
  } else {
    const app = initializeApp(firebaseConfig)
    const analytics = getAnalytics(app)
    const firebaseTracker = {
      logEvent: async (name: string, params: Record<string, any>) => {
        return logEvent(analytics, name, params)
      },
      setUserId: async (id: string) => {
        return setUserId(analytics, id)
      },
      setUserProperties: async (properties: Record<string, any>) => {
        return setUserProperties(analytics, properties)
      },
    }
    setFirebaseTracker(firebaseTracker)
  }

  setOpenPanelTracker(op)
  setPostHogTracker(
    posthog.init(env.VITE_POSTHOG_KEY, {
      api_host: env.VITE_POSTHOG_HOST,
      person_profiles: "always",
      defaults: "2025-05-24",
    }),
  )

  let session: AuthSession | undefined
  try {
    const queryData = JSON.parse(window.localStorage.getItem(QUERY_PERSIST_KEY) ?? "{}")
    session = queryData.clientState.queries.find(
      (query: any) => query.queryHash === JSON.stringify(["auth", "session"]),
    )?.state.data.data
  } catch {
    // do nothing
  }
  if (session?.user) {
    tracker.identify(session.user)
  }
}

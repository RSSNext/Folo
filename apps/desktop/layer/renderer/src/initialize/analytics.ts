import { env } from "@follow/shared/env.desktop"
import type { AuthSession } from "@follow/shared/hono"
import { setOpenPanelTracker, setPostHogTracker, tracker } from "@follow/tracker"
// const firebaseConfig = env.VITE_FIREBASE_CONFIG ? JSON.parse(env.VITE_FIREBASE_CONFIG) : null
import posthog from "posthog-js"

// import { getAnalytics, logEvent, setUserId, setUserProperties } from "firebase/analytics"
// import { initializeApp } from "firebase/app"
import { QUERY_PERSIST_KEY } from "~/constants/app"

import { op } from "./op"

export const initAnalytics = async () => {
  if (env.VITE_OPENPANEL_CLIENT_ID === undefined) return

  op.setGlobalProperties({
    build: ELECTRON ? "electron" : "web",
    version: APP_VERSION,
    hash: GIT_COMMIT_SHA,
  })

  setOpenPanelTracker(op)

  setPostHogTracker(
    posthog.init(env.VITE_POSTHOG_KEY, {
      api_host: env.VITE_POSTHOG_HOST,
      person_profiles: "identified_only",
      defaults: "2025-05-24",
    }),
  )

  // TODO: firebase analytics is not working on pages using without http protocol
  // if (firebaseConfig) {
  //   const app = initializeApp(firebaseConfig)
  //   getAnalytics(app)

  //   setFirebaseTracker({
  //     logEvent: async (name, params) => {
  //       const analytics = getAnalytics()
  //       return logEvent(analytics, name, params)
  //     },
  //     setUserId: async (id) => {
  //       const analytics = getAnalytics()
  //       return setUserId(analytics, id)
  //     },
  //     setUserProperties: async (properties) => {
  //       const analytics = getAnalytics()
  //       return setUserProperties(analytics, properties)
  //     },
  //   })
  // }

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
    await tracker.identify(session.user)
  }
}

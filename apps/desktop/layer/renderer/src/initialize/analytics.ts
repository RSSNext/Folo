import { env } from "@follow/shared/env.desktop"
import type { AuthSession } from "@follow/shared/hono"
import { setOpenPanelTracker, setPostHogTracker, tracker } from "@follow/tracker"
import posthog from "posthog-js"

import { QUERY_PERSIST_KEY } from "~/constants/app"

import { op } from "./op"

export const initAnalytics = async () => {
  tracker.manager.appendUserProperties({
    build: ELECTRON ? "electron" : "web",
    version: APP_VERSION,
    hash: GIT_COMMIT_SHA,
    language: navigator.language,
  })

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

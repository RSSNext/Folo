import { env } from "@follow/shared/env.ssr"
import { setOpenPanelTracker } from "@follow/tracker"

import { op } from "./op"

export const initAnalytics = () => {
  if (env.VITE_OPENPANEL_CLIENT_ID === undefined) return

  setOpenPanelTracker(op)
  op.setGlobalProperties({
    build: "external-web",
    hash: GIT_COMMIT_SHA,
  })
}

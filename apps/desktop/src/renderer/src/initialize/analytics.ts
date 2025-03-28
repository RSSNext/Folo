import { env } from "@follow/shared/env.desktop"
import { setOpenPanelTracker } from "@follow/tracker"

import { op } from "./op"

export const initAnalytics = () => {
  if (env.VITE_OPENPANEL_CLIENT_ID === undefined) return

  op.setGlobalProperties({
    build: ELECTRON ? "electron" : "web",
    version: APP_VERSION,
    hash: GIT_COMMIT_SHA,
  })

  setOpenPanelTracker(op)
}

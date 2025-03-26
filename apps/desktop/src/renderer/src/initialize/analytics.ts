import { env } from "@follow/shared/env.desktop"
import { setOpenPanelTracker } from "@follow/tracker"
import type { TrackProperties } from "@openpanel/web"

import { getGeneralSettings } from "~/atoms/settings/general"
import { whoami } from "~/atoms/user"

import { op } from "./op"

export const initAnalytics = () => {
  if (env.VITE_OPENPANEL_CLIENT_ID === undefined) return

  op.setGlobalProperties({
    build: ELECTRON ? "electron" : "web",
    version: APP_VERSION,
    hash: GIT_COMMIT_SHA,
  })

  setOpenPanelTracker(async (name, properties) => {
    if (import.meta.env.DEV) return
    if (!getGeneralSettings().sendAnonymousData) {
      return
    }
    const me = whoami()

    return op.track(name, {
      ...properties,
      user_id: me?.id,
    } as TrackProperties)
  })
}

import { env } from "@follow/shared/env.desktop"
import { OpenPanel } from "@openpanel/web"
import { app } from "electron"

import { DEVICE_ID } from "~/constants/system"

export const op = new OpenPanel({
  clientId: env.VITE_OPENPANEL_CLIENT_ID ?? "",
  trackScreenViews: false,
  trackOutgoingLinks: false,
  trackAttributes: false,
  trackHashChanges: false,
  apiUrl: env.VITE_OPENPANEL_API_URL,
})

op.setGlobalProperties({
  device_id: DEVICE_ID,
  app_version: app.getVersion(),
  build: "electron",
})

import { env } from "@follow/shared/env.desktop"
import { OpenPanel } from "@openpanel/web"

export const op = new OpenPanel({
  clientId: env.VITE_OPENPANEL_CLIENT_ID ?? "",
  trackScreenViews: true,
  trackOutgoingLinks: true,
  trackAttributes: true,
  apiUrl: env.VITE_OPENPANEL_API_URL,
})

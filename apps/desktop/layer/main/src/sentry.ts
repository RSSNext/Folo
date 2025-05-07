import { app } from "electron"
import { FetchError } from "ofetch"

import { DEVICE_ID } from "./constants/system"

export const initializeSentry = async () => {
  const { captureConsoleIntegration, init, setTag } = await import("@sentry/electron/main")
  init({
    dsn: process.env.VITE_SENTRY_DSN,
    integrations: [
      captureConsoleIntegration({
        levels: ["error"],
      }),
    ],

    beforeSend(event, hint) {
      const error = hint.originalException

      if (
        error instanceof Error &&
        (/Network Error/i.test(error.message) ||
          /Fetch Error/i.test(error.message) ||
          /XHR Error/i.test(error.message) ||
          /adsbygoogle/i.test(error.message) ||
          /Failed to fetch/i.test(error.message) ||
          error.message.includes("fetch failed"))
      ) {
        return null
      }

      if (error instanceof FetchError) {
        return null
      }

      return event
    },
  })
  setTag("device_id", DEVICE_ID)
  setTag("app_version", app.getVersion())
  setTag("build", "electron")
}

import type { AuthUser } from "@follow/shared/hono"
import { identifyUserOpenPanel, tracker } from "@follow/tracker"

import { op } from "./op"

export const setIntegrationIdentify = async (user: AuthUser) => {
  identifyUserOpenPanel(user, op.identify.bind(op))
  tracker.identify(user.id)

  await import("@sentry/react").then(({ setTag }) => {
    setTag("user_id", user.id)
    setTag("user_name", user.name)
  })
}

import type { AuthUser } from "@follow/shared/hono"
import { tracker } from "@follow/tracker"

export const setIntegrationIdentify = async (user: AuthUser) => {
  tracker.identify(user)

  await import("@sentry/react").then(({ setTag }) => {
    setTag("user_id", user.id)
    setTag("user_name", user.name)
  })
}

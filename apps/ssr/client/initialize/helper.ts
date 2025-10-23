import { tracker } from "@follow/tracker"
import type { AuthUser } from "@follow-app/client-sdk"

export const setIntegrationIdentify = async (user: AuthUser) => {
  tracker.identify(user)

  await import("@sentry/react").then(({ setTag }) => {
    setTag("user_id", user.id)
    setTag("user_name", user.name)
  })
}

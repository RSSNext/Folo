import type { UserModel } from "@follow/models"
import { tracker } from "@follow/tracker"

export const setIntegrationIdentify = async (user: UserModel) => {
  tracker.identify(user)
  await import("@sentry/react").then(({ setTag }) => {
    setTag("user_id", user.id)
    setTag("user_name", user.name)
  })
}

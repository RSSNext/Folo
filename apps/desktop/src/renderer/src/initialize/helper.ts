import type { UserModel } from "@follow/models"
import { identifyUserOpenPanel } from "@follow/tracker"

import { op } from "./op"

export const setIntegrationIdentify = async (user: UserModel) => {
  identifyUserOpenPanel(user, op.identify.bind(op))
  op.track("identify", {
    user_id: user.id,
  })
  await import("@sentry/react").then(({ setTag }) => {
    setTag("user_id", user.id)
    setTag("user_name", user.name)
  })
}

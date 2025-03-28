import type { UserModel } from "@follow/models"

import { op } from "./op"

export const setIntegrationIdentify = async (user: UserModel) => {
  op.identify({
    profileId: user.id,
    email: user.email,
    lastName: user.name ?? undefined,
    avatar: user.image ?? undefined,
    properties: {
      handle: user.handle,
    },
  })
  await import("@sentry/react").then(({ setTag }) => {
    setTag("user_id", user.id)
    setTag("user_name", user.name)
  })
}

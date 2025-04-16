import { deleteNotificationsToken, updateNotificationsToken } from "~/lib/user"

import { t } from "./_instance"

export const authRoute = {
  sessionChanged: t.procedure.action(async () => {
    await updateNotificationsToken()
  }),

  signOut: t.procedure.action(async () => {
    await deleteNotificationsToken()
  }),
}

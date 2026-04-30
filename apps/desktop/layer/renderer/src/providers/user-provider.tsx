import { useEffect } from "react"

import { setIntegrationIdentify } from "~/initialize/helper"
import { useAuthSessionCookieRefresh, useSession } from "~/queries/auth"

export const UserProvider = () => {
  const { session } = useSession()
  useAuthSessionCookieRefresh(!!session?.user)

  useEffect(() => {
    if (!session?.user) return

    setIntegrationIdentify(session.user)
  }, [session?.user])

  return null
}

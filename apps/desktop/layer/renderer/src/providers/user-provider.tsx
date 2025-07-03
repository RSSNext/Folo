import { useEffect } from "react"

import { setIntegrationIdentify } from "~/initialize/helper"
import { useSession } from "~/queries/auth"

export const UserProvider = () => {
  const { session } = useSession()

  useEffect(() => {
    if (!session?.user) return
    // @ts-expect-error FIXME
    setIntegrationIdentify(session.user)
  }, [session?.role, session?.user])

  return null
}

import { useEffect } from "react"

import { setIntegrationIdentify } from "~/initialize/helper"
import { useSession } from "~/queries/auth"

export const UserProvider = () => {
  const { session } = useSession()

  useEffect(() => {
    if (!session?.user) return

    setIntegrationIdentify(session.user)
  }, [session?.user])

  return null
}

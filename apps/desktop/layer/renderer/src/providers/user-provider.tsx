import type { UserRole } from "@follow/constants"
import { useEffect } from "react"

import { setUserRole, setWhoami } from "~/atoms/user"
import { setIntegrationIdentify } from "~/initialize/helper"
import { useSession } from "~/queries/auth"

export const UserProvider = () => {
  const { session } = useSession()

  useEffect(() => {
    if (!session?.user) return
    setWhoami(session.user)
    if (session.role) {
      setUserRole(session.role as UserRole)
    }
    // @ts-expect-error FIXME
    setIntegrationIdentify(session.user)
  }, [session?.role, session?.user])

  return null
}

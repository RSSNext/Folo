import type { UserRole } from "@follow/constants"
import { useEffect } from "react"

import { setUserRole, setWhoami } from "~/atoms/user"
import { setIntegrationIdentify } from "~/initialize/helper"
import { useSession } from "~/queries/auth"
import { CleanerService } from "~/services/cleaner"

export const UserProvider = () => {
  const { session } = useSession()

  useEffect(() => {
    if (!session?.user) return
    setWhoami(session.user)
    if (session.role) {
      setUserRole(session.role as UserRole)
    }
    setIntegrationIdentify(session.user)

    CleanerService.cleanRemainingData(session.user.id)
  }, [session?.role, session?.user])

  return null
}

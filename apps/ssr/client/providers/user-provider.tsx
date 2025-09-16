import { setWhoami } from "@client/atoms/user"
import { setIntegrationIdentify } from "@client/initialize/helper"
import { useSession } from "@client/query/auth"
import type { AuthUser } from "@follow-app/client-sdk"
import { useEffect } from "react"

export const UserProvider = () => {
  const { session } = useSession()

  useEffect(() => {
    if (!session?.user) return
    // @ts-expect-error FIXME
    setWhoami(session.user)

    setIntegrationIdentify(session.user as unknown as AuthUser)
  }, [session?.user])

  return null
}

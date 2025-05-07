import { setWhoami } from "@client/atoms/user"
import { setIntegrationIdentify } from "@client/initialize/helper"
import { useSession } from "@client/query/auth"
import { useEffect } from "react"

export const UserProvider = () => {
  const { session } = useSession()

  useEffect(() => {
    if (!session?.user) return
    setWhoami(session.user)

    setIntegrationIdentify(session.user)
  }, [session?.user])

  return null
}

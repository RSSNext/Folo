import { setWhoami } from "@client/atoms/user"
import { setIntegrationIdentify } from "@client/initialize/helper"
import { useSession } from "@client/query/auth"
import type { AuthUser } from "@follow-app/client-sdk"
import { useEffect } from "react"
import * as React from "react"
import { Outlet } from "react-router"

export function Component() {
  return (
    <>
      <UserProvider />
      <Outlet />
    </>
  )
}

const UserProvider = () => {
  const { session } = useSession()

  useEffect(() => {
    if (!session?.user) return

    setWhoami(session.user as unknown as AuthUser)

    setIntegrationIdentify(session.user as unknown as AuthUser)
  }, [session?.user])

  return null
}

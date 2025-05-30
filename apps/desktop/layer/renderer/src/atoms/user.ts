import type { UserRole } from "@follow/constants"
import type { AuthSession } from "@follow/shared/hono"
import { atom } from "jotai"

import { createAtomHooks } from "~/lib/jotai"

export const [, , useWhoami, , whoami, setWhoami] = createAtomHooks(
  atom<Nullable<NonNullable<AuthSession>["user"]>>(null),
)

export const [, , useLoginModalShow, useSetLoginModalShow, getLoginModalShow, setLoginModalShow] =
  createAtomHooks(atom<boolean>(false))

/**
 * For public beta trial user
 */
export const [, , useUserRole, , getUserRole, setUserRole] = createAtomHooks(
  atom<Nullable<UserRole>>(null),
)

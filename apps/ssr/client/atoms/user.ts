import { createAtomHooks } from "@follow/utils/jotai"
import type { AuthUser } from "@follow-app/client-sdk"
import { atom } from "jotai"

export const [, , useWhoami, , whoami, setWhoami] = createAtomHooks(atom<Nullable<AuthUser>>(null))

export const [, , useLoginModalShow, useSetLoginModalShow, getLoginModalShow, setLoginModalShow] =
  createAtomHooks(atom<boolean>(false))

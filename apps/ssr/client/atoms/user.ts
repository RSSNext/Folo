import { createAtomHooks, jotaiStore } from "@follow/utils/jotai"
import type { AuthUser } from "@follow-app/client-sdk"
import { atom, useAtomValueRawSync } from "jotai"

const whoamiAtom = atom<Nullable<AuthUser>>(null)
export const [, , , , whoami, setWhoami] = createAtomHooks(whoamiAtom)
// The user provider writes the session user in an effect of the same commit that mounts the
// login page's avatar, which a plain useAtomValue subscription would miss
export const useWhoami = () => useAtomValueRawSync(whoamiAtom, { store: jotaiStore })

export const [, , useLoginModalShow, useSetLoginModalShow, getLoginModalShow, setLoginModalShow] =
  createAtomHooks(atom<boolean>(false))

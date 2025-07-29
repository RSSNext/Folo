import type { UserModel } from "@follow/models"
import { createAtomHooks } from "@follow/utils/jotai"
import { atom } from "jotai"

export const [, , useWhoami, , whoami, setWhoami] = createAtomHooks(atom<Nullable<UserModel>>(null))

export const [, , useLoginModalShow, useSetLoginModalShow, getLoginModalShow, setLoginModalShow] =
  createAtomHooks(atom<boolean>(false))

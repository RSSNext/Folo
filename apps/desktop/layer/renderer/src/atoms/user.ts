import { atom } from "jotai"

import { createAtomHooks } from "~/lib/jotai"

export const [, , useLoginModalShow, useSetLoginModalShow, getLoginModalShow, setLoginModalShow] =
  createAtomHooks(atom<boolean>(false))

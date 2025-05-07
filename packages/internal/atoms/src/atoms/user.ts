import { createAtomHooks } from "@follow/utils/jotai"
import { atom } from "jotai"

export const [, , useWhoami, , whoami, setWhoami] =
  createAtomHooks(
    atom<
      Nullable<{
        id: string
        name: string | null
        image: string | null
        handle: string | null
        email?: string
      }>
    >(),
  )

export const [, , useLoginModalShow, useSetLoginModalShow, getLoginModalShow, setLoginModalShow] =
  createAtomHooks(atom<boolean>(false))

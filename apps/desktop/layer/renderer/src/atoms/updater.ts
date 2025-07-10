import { atom } from "jotai"

import { createAtomHooks } from "~/lib/jotai"

export type UpdaterStatus = "ready"
export type UpdaterStatusAtom = {
  type: "app" | "renderer"
  status: UpdaterStatus
  finishUpdate?: () => void
} | null
export const [, , useUpdaterStatus, , getUpdaterStatus, setUpdaterStatus] = createAtomHooks(
  atom(null as UpdaterStatusAtom),
)

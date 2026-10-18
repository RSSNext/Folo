import { atom } from "jotai"

import { createAtomHooks } from "~/lib/jotai"

export const [, , useApiUnreachable, , getApiUnreachable, setApiUnreachable] = createAtomHooks(
  atom(false),
)

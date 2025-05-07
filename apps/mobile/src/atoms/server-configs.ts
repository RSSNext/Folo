import type { ServerConfigs } from "@follow/models/src/types"
import { createAtomHooks } from "@follow/utils/src/jotai"
import { atom } from "jotai"

export const [, , useServerConfigs, , getServerConfigs, setServerConfigs] = createAtomHooks(
  atom<Nullable<ServerConfigs>>(null),
)

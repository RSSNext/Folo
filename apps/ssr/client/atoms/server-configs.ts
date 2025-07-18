import type { ServerConfigs } from "@follow/models/types"
import { createAtomHooks } from "@follow/utils/jotai"
import { atom } from "jotai"

export const [, , useServerConfigs, , getServerConfigs, setServerConfigs] = createAtomHooks(
  atom<Nullable<ServerConfigs>>(null),
)

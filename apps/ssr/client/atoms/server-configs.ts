import { createAtomHooks } from "@follow/utils/jotai"
import type { StatusConfigs } from "@follow-app/client-sdk"
import { atom } from "jotai"

export const [, , useServerConfigs, , getServerConfigs, setServerConfigs] = createAtomHooks(
  atom<Nullable<StatusConfigs>>(null),
)

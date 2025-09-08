import { createAtomHooks } from "@follow/utils/jotai"
import type { ServerConfig } from "@follow-app/client-sdk"
import { atom } from "jotai"

export const [, , useServerConfigs, , getServerConfigs, setServerConfigs] = createAtomHooks(
  atom<Nullable<ServerConfig.StatusConfigs>>(null),
)

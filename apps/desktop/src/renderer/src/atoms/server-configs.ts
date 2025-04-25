import type { ServerConfigs } from "@follow/models/types"
import PKG from "@pkg"
import { atom } from "jotai"

import { createAtomHooks } from "~/lib/jotai"

export const [, , useServerConfigs, , getServerConfigs, setServerConfigs] = createAtomHooks(
  atom<Nullable<ServerConfigs>>(null),
)

export const useIsInMASReview = () => {
  const serverConfigs = useServerConfigs()
  return (
    typeof process !== "undefined" &&
    process.mas &&
    serverConfigs?.MAS_IN_REVIEW_VERSION === PKG.version
  )
}

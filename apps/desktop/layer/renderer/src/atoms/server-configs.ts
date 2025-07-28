import type { ExtractResponseData, GetStatusConfigsResponse } from "@follow-app/client-sdk"
import PKG from "@pkg"
import { atom } from "jotai"

import { createAtomHooks } from "~/lib/jotai"

export const [, , useServerConfigs, , getServerConfigs, setServerConfigs] = createAtomHooks(
  atom<Nullable<ExtractResponseData<GetStatusConfigsResponse>>>(null),
)

export const useIsInMASReview = () => {
  const serverConfigs = useServerConfigs()
  return (
    typeof process !== "undefined" &&
    process.mas &&
    serverConfigs?.MAS_IN_REVIEW_VERSION === PKG.version
  )
}

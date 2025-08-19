import { getStorageNS } from "@follow/utils/ns"
import type { ExtractResponseData, GetStatusConfigsResponse } from "@follow-app/client-sdk"
import PKG from "@pkg"
import { atomWithStorage } from "jotai/utils"

import { createAtomHooks } from "~/lib/jotai"

export const [, , useServerConfigs, , getServerConfigs, setServerConfigs] = createAtomHooks(
  atomWithStorage<Nullable<ExtractResponseData<GetStatusConfigsResponse>>>(
    getStorageNS("server-configs"),
    null,
    undefined,
    {
      getOnInit: true,
    },
  ),
)

export const useIsInMASReview = () => {
  const serverConfigs = useServerConfigs()
  return (
    typeof process !== "undefined" &&
    process.mas &&
    serverConfigs?.MAS_IN_REVIEW_VERSION === PKG.version
  )
}

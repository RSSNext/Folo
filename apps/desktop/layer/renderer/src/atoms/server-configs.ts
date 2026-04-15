import { getStorageNS } from "@follow/utils/ns"
import type { ExtractResponseData, GetStatusConfigsResponse } from "@follow-app/client-sdk"
import PKG from "@pkg"
import { atomWithStorage } from "jotai/utils"

import { createAtomHooks } from "~/lib/jotai"
import { isLocalMASVersionInReview } from "~/lib/mas-review"

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

export const [, , useMASStoreVersion, , getMASStoreVersion, setMASStoreVersion] = createAtomHooks(
  atomWithStorage<null | string>(getStorageNS("mas-store-version"), null, undefined, {
    getOnInit: true,
  }),
)

export type ServerConfigs = ExtractResponseData<GetStatusConfigsResponse>
export type PaymentPlan = ServerConfigs["PAYMENT_PLAN_LIST"][number]
export type PaymentFeature = PaymentPlan["limit"]

export const useIsInMASReview = () => {
  const masStoreVersion = useMASStoreVersion()
  return isLocalMASVersionInReview({
    isMASBuild: typeof process !== "undefined" && !!process.mas,
    localVersion: PKG.version,
    storeVersion: masStoreVersion,
  })
}

export const getIsInMASReview = () => {
  const masStoreVersion = getMASStoreVersion()
  return isLocalMASVersionInReview({
    isMASBuild: typeof process !== "undefined" && !!process.mas,
    localVersion: PKG.version,
    storeVersion: masStoreVersion,
  })
}

export const useIsPaymentEnabled = () => {
  const serverConfigs = useServerConfigs()
  const isInMASReview = useIsInMASReview()
  return !isInMASReview && serverConfigs?.PAYMENT_ENABLED
}

export const getIsPaymentEnabled = () => {
  const serverConfigs = getServerConfigs()
  const isInMASReview = getIsInMASReview()
  return !isInMASReview && serverConfigs?.PAYMENT_ENABLED
}

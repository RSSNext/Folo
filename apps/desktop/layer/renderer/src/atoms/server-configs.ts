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

export type ServerConfigs = ExtractResponseData<GetStatusConfigsResponse>
export type PaymentPlan = ServerConfigs["PAYMENT_PLAN_LIST"][number]
export type PaymentFeature = PaymentPlan["limit"]

export const useIsInMASReview = () => {
  const serverConfigs = useServerConfigs()
  return (
    typeof process !== "undefined" &&
    process.mas &&
    serverConfigs?.MAS_IN_REVIEW_VERSION === PKG.version
  )
}

export const getIsInMASReview = () => {
  const serverConfigs = getServerConfigs()
  return (
    typeof process !== "undefined" &&
    process.mas &&
    serverConfigs?.MAS_IN_REVIEW_VERSION === PKG.version
  )
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

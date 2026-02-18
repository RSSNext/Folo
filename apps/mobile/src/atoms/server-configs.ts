import { createAtomHooks } from "@follow/utils/jotai"
import type { StatusConfigs } from "@follow-app/client-sdk"
import { atom } from "jotai"

import { isPaymentFeatureEnabled } from "@/src/lib/payment"

export const [, , useServerConfigs, , getServerConfigs, setServerConfigs] = createAtomHooks(
  atom<Nullable<StatusConfigs>>(null),
)

export const useIsPaymentEnabled = () => {
  const serverConfigs = useServerConfigs()
  return isPaymentFeatureEnabled(serverConfigs?.PAYMENT_ENABLED)
}

export const getIsPaymentEnabled = () => {
  const serverConfigs = getServerConfigs()
  return isPaymentFeatureEnabled(serverConfigs?.PAYMENT_ENABLED)
}

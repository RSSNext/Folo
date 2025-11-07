import { createAtomHooks } from "@follow/utils/jotai"
import type { StatusConfigs } from "@follow-app/client-sdk"
import { atom } from "jotai"

export const [, , useServerConfigs, , getServerConfigs, setServerConfigs] = createAtomHooks(
  atom<Nullable<StatusConfigs>>(null),
)

export const useIsPaymentEnabled = () => {
  const serverConfigs = useServerConfigs()
  return Boolean(serverConfigs?.PAYMENT_ENABLED)
}

export const getIsPaymentEnabled = () => {
  const serverConfigs = getServerConfigs()
  return Boolean(serverConfigs?.PAYMENT_ENABLED)
}

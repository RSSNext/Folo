import { atom } from "jotai"

import { createAtomHooks } from "~/lib/jotai"

import { getIsZenMode, useIsZenMode } from "./settings/ui"

const [
  ,
  ,
  internal_useSubscriptionColumnShow,
  ,
  internal_getSubscriptionShow,
  setTimelineColumnShow,
] = createAtomHooks(atom(true))

export const useSubscriptionColumnShow = () => {
  const isZenMode = useIsZenMode()
  return internal_useSubscriptionColumnShow() && !isZenMode
}

export const getSubscriptionColumnShow = () => {
  const isZenMode = getIsZenMode()
  return internal_getSubscriptionShow() && !isZenMode
}

export { setTimelineColumnShow }

export const [
  ,
  ,
  useSubscriptionColumnTempShow,
  ,
  getSubscriptionColumnTempShow,
  setSubscriptionColumnTempShow,
] = createAtomHooks(atom(false))

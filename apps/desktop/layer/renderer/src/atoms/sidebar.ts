import { atom } from "jotai"

import { createAtomHooks } from "~/lib/jotai"

const [
  ,
  ,
  internal_useSubscriptionColumnShow,
  ,
  internal_getSubscriptionShow,
  setTimelineColumnShow,
] = createAtomHooks(atom(true))

export const useSubscriptionColumnShow = () => {
  return internal_useSubscriptionColumnShow()
}

export const getSubscriptionColumnShow = () => {
  return internal_getSubscriptionShow()
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

import { atom } from "jotai"
import type { ReactNode } from "react"

import { createAtomHooks } from "~/lib/jotai"

const [
  ,
  ,
  internal_useSubscriptionColumnShow,
  ,
  internal_getSubscriptionShow,
  setTimelineColumnShow,
] = createAtomHooks(atom(true))

export const useSubscriptionColumnShow = internal_useSubscriptionColumnShow

export const getSubscriptionColumnShow = internal_getSubscriptionShow

export { setTimelineColumnShow }

export const [
  ,
  ,
  useSubscriptionColumnTempShow,
  ,
  getSubscriptionColumnTempShow,
  setSubscriptionColumnTempShow,
] = createAtomHooks(atom(false))

export const [
  ,
  ,
  useSubscriptionColumnApronNode,
  ,
  getSubscriptionColumnApronNode,
  setSubscriptionColumnApronNode,
] = createAtomHooks(atom<ReactNode | null>(null))

export const [
  ,
  ,
  useSubscriptionEntryPlaneVisible,
  ,
  getSubscriptionEntryPlaneVisible,
  setSubscriptionEntryPlaneVisible,
] = createAtomHooks(atom(true))

import { atom } from "jotai"

import { createAtomHooks } from "~/lib/jotai"

import { getIsZenMode, useIsZenMode } from "./settings/ui"

const [
  ,
  ,
  internal_useTimelineColumnShow,
  ,
  internal_getTimelineColumnShow,
  setTimelineColumnShow,
] = createAtomHooks(atom(true))

export const useTimelineColumnShow = () => {
  const isZenMode = useIsZenMode()
  return internal_useTimelineColumnShow() && !isZenMode
}

export const getFeedColumnShow = () => {
  const isZenMode = getIsZenMode()
  return internal_getTimelineColumnShow() && !isZenMode
}

export { setTimelineColumnShow }

export const [
  ,
  ,
  useTimelineColumnTempShow,
  ,
  getTimelineColumnTempShow,
  setTimelineColumnTempShow,
] = createAtomHooks(atom(false))

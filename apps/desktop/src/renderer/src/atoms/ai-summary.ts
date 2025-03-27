import { atom } from "jotai"

import { createAtomHooks } from "~/lib/jotai"
import type { FlatEntryModel } from "~/store/entry/types"

import { useGeneralSettingKey } from "./settings/general"

export const [, , useShowAISummaryOnce, , getShowAISummaryOnce, setShowAISummaryOnce] =
  createAtomHooks(atom<boolean>(false))

export const toggleShowAISummaryOnce = () => setShowAISummaryOnce((prev) => !prev)
export const enableShowAISummaryOnce = () => setShowAISummaryOnce(true)
export const disableShowAISummaryOnce = () => setShowAISummaryOnce(false)

export const useShowAISummaryGlobal = () => {
  return useGeneralSettingKey("summary")
}

export const useShowAISummary = (entry?: FlatEntryModel | null) => {
  const showAISummaryGlobal = useShowAISummaryGlobal()
  const showAISummaryOnce = useShowAISummaryOnce()
  return showAISummaryGlobal ?? showAISummaryOnce ?? !!entry?.settings?.summary
}

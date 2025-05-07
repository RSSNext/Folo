import { atom } from "jotai"

import { createAtomHooks } from "~/lib/jotai"
import type { FlatEntryModel } from "~/store/entry/types"

import { useGeneralSettingKey } from "./settings/general"

export const [, , useShowAISummaryOnce, , getShowAISummaryOnce, setShowAISummaryOnce] =
  createAtomHooks(atom<boolean>(false))

export const toggleShowAISummaryOnce = () => setShowAISummaryOnce((prev) => !prev)
export const enableShowAISummaryOnce = () => setShowAISummaryOnce(true)
export const disableShowAISummaryOnce = () => setShowAISummaryOnce(false)

export const useShowAISummaryAuto = (entry: FlatEntryModel | null) => {
  return useGeneralSettingKey("summary") || !!entry?.settings?.summary
}

export const useShowAISummary = (entry: FlatEntryModel | null) => {
  const showAISummaryAuto = useShowAISummaryAuto(entry)
  const showAISummaryOnce = useShowAISummaryOnce()
  return showAISummaryAuto || showAISummaryOnce || !!entry?.settings?.summary
}

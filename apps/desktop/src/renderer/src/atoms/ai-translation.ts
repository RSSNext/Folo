import { atom } from "jotai"

import { createAtomHooks } from "~/lib/jotai"
import type { FlatEntryModel } from "~/store/entry/types"

import { useGeneralSettingKey } from "./settings/general"

export const [, , useShowAITranslationOnce, , getShowAITranslationOnce, setShowAITranslationOnce] =
  createAtomHooks(atom<boolean>(false))

export const toggleShowAITranslationOnce = () => setShowAITranslationOnce((prev) => !prev)
export const enableShowAITranslationOnce = () => setShowAITranslationOnce(true)
export const disableShowAITranslationOnce = () => setShowAITranslationOnce(false)

export const useShowAITranslationGlobal = () => {
  return useGeneralSettingKey("translation")
}

export const useShowAITranslationAuto = (entry?: FlatEntryModel | null) => {
  return useGeneralSettingKey("translation") || !!entry?.settings?.translation
}

export const useShowAITranslation = (entry?: FlatEntryModel | null) => {
  const showAITranslationAuto = useShowAITranslationAuto(entry)
  const showAITranslationOnce = useShowAITranslationOnce()
  return showAITranslationAuto || showAITranslationOnce
}

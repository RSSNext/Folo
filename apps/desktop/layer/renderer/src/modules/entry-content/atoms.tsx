import { getStorageNS } from "@follow/utils/ns"
import { atom } from "jotai"
import { atomWithStorage } from "jotai/utils"

import { createAtomHooks } from "~/lib/jotai"

export const [, , useEntryTitleMeta, , getEntryTitleMeta, setEntryTitleMeta] = createAtomHooks(
  atom(
    null as Nullable<{
      entryTitle: string
      feedTitle: string
    }>,
  ),
)

export const [
  ,
  ,
  useEntryContentScrollToTop,
  ,
  getEntryContentScrollToTop,
  setEntryContentScrollToTop,
] = createAtomHooks(atom(false))

export const [, , , , getTranslationCache, setTranslationCache] = createAtomHooks(
  atomWithStorage(getStorageNS("translation-cache"), {} as Record<string, string>),
)

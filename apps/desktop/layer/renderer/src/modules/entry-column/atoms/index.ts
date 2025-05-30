import { createAtomHooks } from "@follow/utils/jotai"
import { getStorageNS } from "@follow/utils/ns"
import { atomWithStorage } from "jotai/utils"

export const [, , useMasonryColumnValue, , getMasonryColumnValue, setMasonryColumnValue] =
  createAtomHooks(atomWithStorage(getStorageNS("masonry-column"), -1))

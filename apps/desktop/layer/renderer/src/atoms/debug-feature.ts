import { createAtomHooks } from "@follow/utils/jotai"
import { getStorageNS } from "@follow/utils/ns"
import { atomWithStorage } from "jotai/utils"

export const [, , useDebugFeatureValue, getDebugFeatureValue, ,] = createAtomHooks(
  atomWithStorage(getStorageNS("debug-feature"), {}),
)

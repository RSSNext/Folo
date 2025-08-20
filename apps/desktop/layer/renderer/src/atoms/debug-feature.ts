import { createAtomHooks } from "@follow/utils/jotai"
import { getStorageNS } from "@follow/utils/ns"
import { atomWithStorage } from "jotai/utils"

// Shape: { __override?: boolean, [featureKey: string]: boolean }
export const [
  ,
  ,
  useDebugFeatureValue,
  useSetDebugFeatureValue,
  getDebugFeatureValue,
  setDebugFeatureValue,
] = createAtomHooks(atomWithStorage<Record<string, unknown>>(getStorageNS("debug-feature"), {}))

export { useDebugFeatureValue as useDebugFeatures }

import { createAtomHooks } from "@follow/utils/jotai"
import { getStorageNS } from "@follow/utils/ns"
import { atomWithStorage } from "jotai/utils"

// Shape: { __override?: boolean, [featureKey: string]: boolean }
// `getOnInit` reads the stored overrides before the first render. Without it the value is only
// loaded when the first reader subscribes, and jotai v3 does not re-render the other readers
// mounted in the same commit, so they keep the empty default.
export const [
  ,
  ,
  useDebugFeatureValue,
  useSetDebugFeatureValue,
  getDebugFeatureValue,
  setDebugFeatureValue,
] = createAtomHooks(
  atomWithStorage<Record<string, unknown>>(getStorageNS("debug-feature"), {}, undefined, {
    getOnInit: true,
  }),
)

export { useDebugFeatureValue as useDebugFeatures }

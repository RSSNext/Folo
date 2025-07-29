import { getStorageNS } from "@follow/utils/ns"
import { atomWithStorage } from "jotai/utils"

import { createAtomHooks } from "~/lib/jotai"

type CornerPlayerAtomValue = {
  show: boolean
  type?: "audio"
  entryId?: string
  url?: string
}

const cornerPlayerInitialValue: CornerPlayerAtomValue = {
  show: false,
}

export const [
  cornerPlayerAtom,
  useCornerPlayerAtom,
  useCornerPlayerAtomValue,
  useSetCornerPlayerAtom,
  getCornerPlayerAtomValue,
  setCornerPlayerAtomValue,
] = createAtomHooks<CornerPlayerAtomValue>(
  atomWithStorage(getStorageNS("corner-player"), cornerPlayerInitialValue, undefined, {
    getOnInit: true,
  }),
)

import type { ExtractAtomValue, getDefaultStore } from "jotai"
import { useAtomValue } from "jotai"
import { selectAtom } from "jotai/utils"
import { useCallback } from "react"
import { shallow } from "zustand/shallow"

import { viewportAtom } from "../atoms/viewport"

export const useViewport = <T>(selector: (value: ExtractAtomValue<typeof viewportAtom>) => T): T =>
  useAtomValue(
    selectAtom(
      viewportAtom,
      useCallback((atomValue) => selector(atomValue), []),
      shallow,
    ),
  )

type JotaiStore = ReturnType<typeof getDefaultStore>
export const getViewport = (store: JotaiStore) => store.get(viewportAtom)

import type { PrimitiveAtom } from "jotai"
import { createContext } from "react"

import type { ResolvedTabScreenProps } from "./types"

export interface BottomTabContextType {
  currentIndexAtom: PrimitiveAtom<number>

  loadedableIndexAtom: PrimitiveAtom<Set<number>>

  tabScreensAtom: PrimitiveAtom<ResolvedTabScreenProps[]>
  tabHeightAtom: PrimitiveAtom<number>
}
export const BottomTabContext = createContext<BottomTabContextType>(null!)

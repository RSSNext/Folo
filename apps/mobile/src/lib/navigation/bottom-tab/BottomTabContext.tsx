import type { PrimitiveAtom } from "jotai"
import { createContext } from "react"

import type { TabScreenProps } from "./types"

export interface BottomTabContextType {
  currentIndexAtom: PrimitiveAtom<number>

  loadedableIndexAtom: PrimitiveAtom<Set<number>>

  tabScreensAtom: PrimitiveAtom<TabScreenProps[]>
  tabHeightAtom: PrimitiveAtom<number>
}
export const BottomTabContext = createContext<BottomTabContextType>(null!)

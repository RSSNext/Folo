import type { PrimitiveAtom } from "jotai"
import { createContext } from "react"

export interface TabScreenContextType {
  tabScreenIndex: number

  titleAtom: PrimitiveAtom<string>
  identifierAtom: PrimitiveAtom<string>
}
export const TabScreenContext = createContext<TabScreenContextType>(null!)

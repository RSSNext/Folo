import type { PrimitiveAtom } from "jotai"
import { createContext } from "react"

export const DiscoverContext = createContext<{
  headerHeightAtom: PrimitiveAtom<number>
}>(null!)

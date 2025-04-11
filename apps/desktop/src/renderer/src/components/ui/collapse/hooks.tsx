import type { PrimitiveAtom } from "jotai"
import { createContext, useContext } from "react"

export interface CollapseContextValue {
  currentOpenCollapseIdAtom: PrimitiveAtom<string | null>
  collapseGroupItemStateAtom: PrimitiveAtom<Record<string, boolean>>
}
export const CollaspeContext = createContext<CollapseContextValue>(null!)
export const useCollapseContext = () => {
  const ctx = useContext(CollaspeContext)
  if (!ctx) {
    throw new Error("CollapseContext not found")
  }
  return ctx
}

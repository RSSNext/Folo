import type { PrimitiveAtom } from "jotai"
import { createContext, use } from "react"

export type EntryRootStateContext = {
  isScrolledBeyondThreshold: PrimitiveAtom<boolean>
}

export const EntryRootStateContext = createContext<EntryRootStateContext>(null!)

export const useEntryRootState = () => {
  const context = use(EntryRootStateContext)
  if (!context) {
    throw new Error("useEntryRootState must be used within a EntryRootStateContext")
  }
  return context
}

import type { PrimitiveAtom } from "jotai"
import { createContext, useContext } from "react"

interface EntryContentContextType {
  showAISummaryAtom: PrimitiveAtom<boolean>
  showReadabilityAtom: PrimitiveAtom<boolean>
  showTranslationAtom: PrimitiveAtom<boolean>
}
export const EntryContentContext = createContext<EntryContentContextType>(null!)
export const useEntryContentContext = () => {
  const context = useContext(EntryContentContext)
  if (!context) {
    throw new Error("useEntryContentContext must be used within a EntryContentContext")
  }
  return context
}

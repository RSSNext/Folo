import type { PrimitiveAtom } from "jotai"
import { createContext, use } from "react"

interface EntryContentContextType {
  showAISummaryAtom: PrimitiveAtom<boolean>
  showAITranslationAtom: PrimitiveAtom<boolean>
  showReadabilityAtom: PrimitiveAtom<boolean>
  titleHeightAtom: PrimitiveAtom<number>
}
export const EntryContentContext = createContext<EntryContentContextType>(null!)
export const useEntryContentContext = () => {
  const context = use(EntryContentContext)
  if (!context) {
    throw new Error("useEntryContentContext must be used within a EntryContentContext")
  }
  return context
}

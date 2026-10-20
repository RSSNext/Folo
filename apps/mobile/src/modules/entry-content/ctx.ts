import type { PrimitiveAtom } from "jotai"
import { createContext, use } from "react"
import type { SharedValue } from "react-native-reanimated"

interface EntryContentContextType {
  showAISummaryAtom: PrimitiveAtom<boolean>
  showAITranslationAtom: PrimitiveAtom<boolean>
  showReadabilityAtom: PrimitiveAtom<boolean>
  showSourceContentAtom: PrimitiveAtom<boolean>
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

/**
 * How far the reader's header and bottom controls have slid away while scrolling down, from 0
 * shown to 1 hidden. The header drives it and the controls follow, across the entries read in turn.
 */
export const EntryReaderBarsHiddenContext = createContext<SharedValue<number> | null>(null)

import { atom } from "jotai"
import { createContext, use } from "react"

interface SheetContextValue {
  dismiss: () => void
}
export const SheetContext = createContext<SheetContextValue | null>(null)

export const useSheetContext = () => use(SheetContext)
export const sheetStackAtom = atom([] as HTMLDivElement[])

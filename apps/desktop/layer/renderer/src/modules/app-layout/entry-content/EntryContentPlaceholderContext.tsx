import type { PrimitiveAtom } from "jotai"
import { createContext } from "react"

import type { DayOf } from "~/modules/ai-daily/constants"

export const EntryContentPlaceholderContext = createContext<EntryContentPlaceholderContextValue>(
  null!,
)

export type EntryContentPlaceholderContextValue = {
  openedSummary: PrimitiveAtom<null | DayOf>
}

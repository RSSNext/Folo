import type { EnhanceSet } from "@follow/utils"
import type { PrimitiveAtom } from "jotai"
import { createContext } from "react"

export const FocusableContext = createContext(false)
export const FocusTargetRefContext = createContext<React.RefObject<HTMLElement | undefined>>(null!)
export const FocusableContainerRefContext = createContext<React.RefObject<HTMLDivElement | null>>(
  null!,
)
export const FocusActionsContext = createContext<{
  highlightBoundary: () => void
}>(null!)

export const GlobalFocusableContext = createContext<PrimitiveAtom<EnhanceSet<string>>>(null!)

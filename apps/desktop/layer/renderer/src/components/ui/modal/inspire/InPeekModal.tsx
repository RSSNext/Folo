import { createContext, use } from "react"

export const InPeekModal = createContext(false)
InPeekModal.displayName = "InPeekModal"
export const useInPeekModal = () => use(InPeekModal)

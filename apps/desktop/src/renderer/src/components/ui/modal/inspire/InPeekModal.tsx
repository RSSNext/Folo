import { createContext, useContext } from "react"

export const InPeekModal = createContext(false)
InPeekModal.displayName = "InPeekModal"
export const useInPeekModal = () => useContext(InPeekModal)

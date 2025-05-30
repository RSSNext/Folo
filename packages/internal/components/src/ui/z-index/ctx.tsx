import { createContext, use } from "react"

export const ZIndexContext = createContext(0)

export const useCorrectZIndex = (zIndex: number) => use(ZIndexContext) + zIndex

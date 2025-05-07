import { createContext } from "react"

export const ScrollElementContext = createContext<HTMLElement | null>(document.documentElement)

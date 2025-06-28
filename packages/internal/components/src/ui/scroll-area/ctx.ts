import { createContext } from "react"

export const ScrollElementContext = createContext<HTMLElement | null>(document.documentElement)

export const ScrollElementEventsContext = createContext<{
  onUpdateMaxScroll?: () => void
}>({
  onUpdateMaxScroll: undefined,
})

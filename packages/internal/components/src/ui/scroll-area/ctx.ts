import { createContext } from "react"

export const ScrollElementContext = createContext<{
  element: HTMLElement | null
  onUpdateMaxScroll?: () => void
}>({
  element: document.documentElement,
})

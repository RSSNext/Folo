import { createContext, use } from "react"

export const useRootPortal = () => {
  const ctx = use(RootPortalContext)

  return ctx || document.body
}

export const RootPortalContext = createContext<HTMLElement | undefined>(undefined)

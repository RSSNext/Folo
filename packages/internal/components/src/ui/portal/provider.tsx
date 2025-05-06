import { createContext, use } from "react"

export const useRootPortal = () => {
  const ctx = use(RootPortalContext)

  return ctx || document.body
}

const RootPortalContext = createContext<HTMLElement | undefined>(undefined)

export const RootPortalProvider = RootPortalContext.Provider

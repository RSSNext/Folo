import type { PrimitiveAtom } from "jotai"
import { useAtomValue } from "jotai"
import { createContext, use } from "react"

export const ScreenNameContext = createContext<PrimitiveAtom<string>>(null!)

export const useScreenName = () => {
  const name = use(ScreenNameContext)
  if (!name) {
    throw new Error("ScreenNameContext not mounted")
  }
  return useAtomValue(name)
}

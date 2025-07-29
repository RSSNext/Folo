import type { Dispatch, SetStateAction } from "react"
import { createContext } from "react"

export const NavigationHeaderHeightContext = createContext<number>(null!)
export const SetNavigationHeaderHeightContext = createContext<Dispatch<SetStateAction<number>>>(
  null!,
)

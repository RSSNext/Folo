import type { Dispatch, SetStateAction } from "react"
import { createContext } from "react"

export const BottomTabBarHeightContext = createContext(0)
export const SetBottomTabBarHeightContext = createContext<Dispatch<SetStateAction<number>>>(null!)

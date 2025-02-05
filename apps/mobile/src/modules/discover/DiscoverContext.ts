import type { PrimitiveAtom } from "jotai"
import { createContext } from "react"
import type { Animated } from "react-native"

export const DiscoverContext = createContext<{
  animatedX: Animated.Value
  currentTabAtom: PrimitiveAtom<number>

  headerHeightAtom: PrimitiveAtom<number>
}>(null!)

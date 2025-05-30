import type { PrimitiveAtom } from "jotai"
import type { ReactNode } from "react"
import { createContext } from "react"
import type { SharedValue } from "react-native-reanimated"

export interface ScreenItemContextType {
  screenId: string

  isFocusedAtom: PrimitiveAtom<boolean>
  isAppearedAtom: PrimitiveAtom<boolean>
  isDisappearedAtom: PrimitiveAtom<boolean>

  // For Layout ScrollView
  reAnimatedScrollY: SharedValue<number>
  scrollViewHeight: SharedValue<number>
  scrollViewContentHeight: SharedValue<number>

  Slot: PrimitiveAtom<{
    header: ReactNode
  }>
}
export const ScreenItemContext = createContext<ScreenItemContextType>(null!)

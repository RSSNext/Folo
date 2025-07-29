import type { PrimitiveAtom } from "jotai"
import type { ReactNode } from "react"
import { createContext, use } from "react"
import type { SharedValue } from "react-native-reanimated"
import { useDerivedValue } from "react-native-reanimated"

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

export const useScrollViewProgress = () => {
  const { reAnimatedScrollY, scrollViewHeight, scrollViewContentHeight } = use(ScreenItemContext)!

  // Use useDerivedValue to create a reactive SharedValue that updates
  // whenever any of the input SharedValues change
  const progress = useDerivedValue(() => {
    // Calculate how far we've scrolled as a proportion of scrollable content
    // Scrollable content = total content height - visible height
    // Progress is clamped between 0 and 1
    const MAGIC_SHIFT = 95 // Adjust this value based on your layout needs
    const scrollableHeight = Math.max(
      0,
      scrollViewContentHeight.value - scrollViewHeight.value - MAGIC_SHIFT,
    )

    if (scrollableHeight <= 0) {
      // If there's no scrollable content, we're at 100% progress
      return 1
    }

    // Calculate progress as a value between 0 and 1
    const progress = Math.min(1, Math.max(0, reAnimatedScrollY.value / scrollableHeight))
    return progress
  }, [reAnimatedScrollY, scrollViewHeight, scrollViewContentHeight])

  return progress
}

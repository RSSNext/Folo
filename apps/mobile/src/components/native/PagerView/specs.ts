import { requireNativeView } from "expo"
import type { NativeSyntheticEvent, ViewProps } from "react-native"

export const EnhancePagerView = requireNativeView<ViewProps & PagerProps>("EnhancePagerView")
export const EnhancePageView = requireNativeView<ViewProps>("EnhancePageView")

export interface PagerProps {
  onPageChange?: (e: NativeSyntheticEvent<{ index: number }>) => void
  onScroll?: (e: NativeSyntheticEvent<{ percent: number; direction: "left" | "right" }>) => void
  onScrollBegin?: () => void
  onScrollEnd?: () => void
  onPageWillAppear?: (e: NativeSyntheticEvent<{ index: number }>) => void
  page?: number
  pageGap?: number
  transitionStyle?: "scroll" | "pageCurl"
}
export interface PagerRef {
  setPage: (index: number) => void
  getPage: () => number
  getState: () => "idle" | "dragging" | "scrolling"
}

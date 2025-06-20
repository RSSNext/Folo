import { requireNativeView } from "expo"
import type { NativeSyntheticEvent, ViewProps } from "react-native"

export const EnhancePagerView = requireNativeView<
  ViewProps &
    PagerProps & {
      ref: React.RefObject<PagerRef | null>
    }
>("EnhancePagerView")
export const EnhancePageView = requireNativeView("EnhancePageView")

export interface PagerProps {
  onPageChange?: (e: NativeSyntheticEvent<{ index: number }>) => void
  onScroll?: (
    e: NativeSyntheticEvent<{
      percent: number
      direction: "left" | "right" | "none"
      position: number
    }>,
  ) => void
  onScrollBegin?: () => void
  onScrollEnd?: (e: NativeSyntheticEvent<{ index: number }>) => void
  onPageWillAppear?: (e: NativeSyntheticEvent<{ index: number }>) => void
  page?: number
  pageGap?: number
  transitionStyle?: "scroll" | "pageCurl"
  initialPageIndex?: number
}
export interface PagerRef {
  setPage: (index: number) => void
  getPage: () => number
  getState: () => "idle" | "dragging" | "scrolling"
}

import { requireNativeView } from "expo"
import type { FC, ReactNode } from "react"
import { useEffect, useImperativeHandle, useRef, useState } from "react"
import type { NativeSyntheticEvent, ViewProps, ViewStyle } from "react-native"

const EnhancePagerView = requireNativeView<ViewProps & PagerProps>("EnhancePagerView")
const EnhancePageView = requireNativeView("EnhancePageView")

interface PagerProps {
  onPageChange?: (e: NativeSyntheticEvent<{ index: number }>) => void
  onScroll?: (e: NativeSyntheticEvent<{ percent: number; direction: "left" | "right" | "none"; position: number }>) => void
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

type PagerViewProps = {
  pageContainerStyle?: ViewStyle
  renderPage?: (index: number) => ReactNode
  pageTotal: number
  pageGap?: number
  transitionStyle?: "scroll" | "pageCurl"
  page?: number
  onPageChange?: (index: number) => void
  onScroll?: (percent: number, direction: "left" | "right" | "none") => void
  onScrollBegin?: () => void
  onScrollEnd?: () => void
  onPageWillAppear?: (index: number) => void
  containerStyle?: ViewStyle
  containerClassName?: string
  ref?: React.Ref<PagerRef>
}
export const PagerView: FC<PagerViewProps> = ({
  pageContainerStyle,
  renderPage,
  pageTotal,
  pageGap,
  transitionStyle,
  containerStyle,
  containerClassName,
  page,
  onPageChange,
  onScroll,
  onScrollBegin,
  onScrollEnd,
  onPageWillAppear,
  ref,
}) => {
  const [currentPage, setCurrentPage] = useState(page ?? 0)

  const nativeRef = useRef<PagerRef>(null)
  useEffect(() => {
    if (nativeRef.current) {
      const state = nativeRef.current.getState()
      if (state === "idle" && currentPage !== nativeRef.current.getPage()) {
        nativeRef.current.setPage(currentPage)
      }
    }
  }, [currentPage])
  useImperativeHandle(ref, () => nativeRef.current!)
  return (
    <EnhancePagerView
      transitionStyle={transitionStyle}
      pageGap={pageGap}
      onPageChange={(e) => {
        setCurrentPage(e.nativeEvent.index)
        onPageChange?.(e.nativeEvent.index)
      }}
      onScroll={(e) => {
        onScroll?.(e.nativeEvent.percent, e.nativeEvent.direction)
      }}
      onScrollBegin={() => {
        onScrollBegin?.()
      }}
      onScrollEnd={() => {
        onScrollEnd?.()
      }}
      onPageWillAppear={(e) => {
        onPageWillAppear?.(e.nativeEvent.index)
      }}
      className={containerClassName}
      style={containerStyle}
      // @ts-expect-error
      ref={nativeRef}
    >
      {Array.from({ length: pageTotal }).map((_, index) => (
        <EnhancePageView key={index} className="flex-1" style={{ ...pageContainerStyle }}>
          {renderPage?.(index)}
        </EnhancePageView>
      ))}
    </EnhancePagerView>
  )
}

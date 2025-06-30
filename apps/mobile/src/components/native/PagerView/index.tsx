import { cn } from "@follow/utils"
import { cssInterop } from "nativewind"
import type { FC, ReactNode, Ref } from "react"
import { useImperativeHandle, useRef, useState } from "react"
import type { StyleProp, ViewStyle } from "react-native"
import { StyleSheet } from "react-native"

import type { PagerRef } from "./specs"
import { EnhancePagerView, EnhancePageView } from "./specs"

cssInterop(EnhancePagerView, {
  className: "style",
})
interface PagerViewProps {
  pageContainerStyle?: ViewStyle
  pageContainerClassName?: string
  renderPage?: (index: number) => ReactNode
  pageTotal: number
  pageGap?: number
  transitionStyle?: "scroll" | "pageCurl"
  page?: number
  onPageChange?: (index: number) => void
  onScroll?: (percent: number, direction: "left" | "right" | "none", position: number) => void
  onScrollBegin?: () => void
  onScrollEnd?: (index: number) => void
  onPageWillAppear?: (index: number) => void
  containerStyle?: StyleProp<ViewStyle>
  containerClassName?: string
  initialPageIndex?: number
  ref?: Ref<PagerRef>
}
export const PagerView: FC<PagerViewProps> = ({
  pageContainerStyle,
  pageContainerClassName,
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
  initialPageIndex,
  ref,
}) => {
  const [currentPage, setCurrentPage] = useState(page ?? 0)

  const nativeRef = useRef<PagerRef>(null)
  useImperativeHandle(ref, () => ({
    setPage: (index: number) => {
      setCurrentPage(index)
      nativeRef.current?.setPage(index)
    },
    getPage: () => currentPage,
    getState: () => nativeRef.current?.getState() ?? "idle",
  }))
  return (
    <EnhancePagerView
      initialPageIndex={initialPageIndex}
      transitionStyle={transitionStyle}
      pageGap={pageGap}
      onPageChange={(e) => {
        setCurrentPage(e.nativeEvent.index)
        onPageChange?.(e.nativeEvent.index)
      }}
      onScroll={(e) => {
        onScroll?.(e.nativeEvent.percent, e.nativeEvent.direction, e.nativeEvent.position)
      }}
      onScrollBegin={() => {
        onScrollBegin?.()
      }}
      onScrollEnd={(e) => {
        onScrollEnd?.(e.nativeEvent.index)
      }}
      onPageWillAppear={(e) => {
        onPageWillAppear?.(e.nativeEvent.index)
      }}
      className={cn("flex-1", containerClassName)}
      style={containerStyle}
      ref={nativeRef}
    >
      {Array.from({ length: pageTotal }).map((_, index) => (
        <EnhancePageView
          key={index}
          className={cn("flex-1", pageContainerClassName)}
          style={{ ...StyleSheet.absoluteFillObject, ...pageContainerStyle }}
        >
          {renderPage?.(index)}
        </EnhancePageView>
      ))}
    </EnhancePagerView>
  )
}

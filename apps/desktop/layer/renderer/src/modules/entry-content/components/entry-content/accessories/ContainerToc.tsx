import { getViewport } from "@follow/components/hooks/useViewport.js"
import { CircleProgress } from "@follow/components/icons/Progress.js"
import { MotionButtonBase } from "@follow/components/ui/button/index.js"
import { RootPortal } from "@follow/components/ui/portal/index.jsx"
import { useScrollViewElement } from "@follow/components/ui/scroll-area/hooks.js"
import { EventBus } from "@follow/utils/event-bus"
import { springScrollTo } from "@follow/utils/scroller"
import { cn } from "@follow/utils/utils"
import { useStore } from "jotai"
import { memo, useEffect, useMemo, useState } from "react"

import { AIChatPanelStyle, useAIChatPanelStyle } from "~/atoms/settings/ai"
import type { TocRef } from "~/components/ui/markdown/components/Toc"
import { Toc } from "~/components/ui/markdown/components/Toc"
import { useFeature } from "~/hooks/biz/useFeature"
import { useWrappedElement, useWrappedElementSize } from "~/providers/wrapped-element-provider"

const useReadPercent = () => {
  const y = 55
  const { h } = useWrappedElementSize()

  const scrollElement = useScrollViewElement()
  const [scrollTop, setScrollTop] = useState(0)

  useEffect(() => {
    const handler = () => {
      if (scrollElement) {
        setScrollTop(scrollElement.scrollTop)
      }
    }
    handler()
    scrollElement?.addEventListener("scroll", handler)
    return () => {
      scrollElement?.removeEventListener("scroll", handler)
    }
  }, [scrollElement])

  const store = useStore()
  const readPercent = useMemo(() => {
    const winHeight = getViewport(store).h
    const deltaHeight = Math.min(scrollTop, winHeight)

    return Math.floor(Math.min(Math.max(0, ((scrollTop - y + deltaHeight) / h) * 100), 100)) || 0
  }, [store, scrollTop, h])

  return [readPercent, scrollTop]
}

const BackTopIndicator: Component = memo(({ className }) => {
  const [readPercent] = useReadPercent()
  const scrollElement = useScrollViewElement()
  const aiEnabled = useFeature("ai")

  const panelStyle = useAIChatPanelStyle()
  const isAiPanelOpen = panelStyle === AIChatPanelStyle.Fixed

  return (
    <span
      className={cn(
        "mt-2 flex grow flex-col px-2 font-sans text-sm text-gray-800 dark:text-neutral-300",
        className,
      )}
    >
      <div className="flex items-center gap-2 tabular-nums">
        <CircleProgress percent={readPercent!} size={14} strokeWidth={2} />
        <span>{readPercent}%</span>
        <br />
      </div>
      {aiEnabled && !isAiPanelOpen && (
        <MotionButtonBase
          onClick={() => {
            EventBus.dispatch("global:toggle-ai-chat-pinned")
          }}
          className={cn(
            "mt-1 flex flex-nowrap items-center gap-2 text-sm opacity-50 transition-all duration-500 hover:opacity-100",
          )}
        >
          <i className="i-mgc-ai-cute-re" />
          <span>Ask AI</span>
        </MotionButtonBase>
      )}
      <MotionButtonBase
        onClick={() => {
          springScrollTo(0, scrollElement!)
        }}
        className={cn(
          "mt-1 flex flex-nowrap items-center gap-2 opacity-50 transition-all duration-500 hover:opacity-100",
          readPercent! > 10 ? "" : "pointer-events-none opacity-0",
        )}
      >
        <i className="i-mingcute-arrow-up-circle-line" />
        <span className="whitespace-nowrap">Back Top</span>
      </MotionButtonBase>
    </span>
  )
})

export const ContainerToc = memo(
  ({ ref, ..._ }: ComponentType & { ref?: React.Ref<TocRef | null> }) => {
    const wrappedElement = useWrappedElement()

    return (
      <RootPortal to={wrappedElement!}>
        <div
          className="@[770px]:block group absolute right-[-130px] top-0 hidden h-full w-[100px]"
          data-hide-in-print
        >
          <div className="sticky top-0">
            <Toc
              ref={ref}
              className={cn(
                "animate-in fade-in-0 slide-in-from-bottom-12 easing-spring spring-soft flex flex-col items-end",
                "scrollbar-none max-h-[calc(100vh-100px)] overflow-auto",
                "@[700px]:-translate-x-12 @[800px]:-translate-x-4 @[900px]:translate-x-0 @[900px]:items-start",
              )}
            />
            <BackTopIndicator
              className={
                "@[700px]:-translate-x-4 @[800px]:-translate-x-8 @[900px]:translate-x-0 @[900px]:items-start"
              }
            />
          </div>
        </div>
      </RootPortal>
    )
  },
)

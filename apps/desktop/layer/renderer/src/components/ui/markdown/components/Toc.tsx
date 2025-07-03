import { useViewport } from "@follow/components/hooks/useViewport.js"
import { EllipsisHorizontalTextWithTooltip } from "@follow/components/ui/typography/EllipsisWithTooltip.js"
import { nextFrame } from "@follow/utils/dom"
import { EventBus } from "@follow/utils/event-bus"
import { cn } from "@follow/utils/utils"
import * as HoverCard from "@radix-ui/react-hover-card"
import { AnimatePresence, m } from "motion/react"
import { memo, use, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react"

import { useRealInWideMode } from "~/atoms/settings/ui"
import { COMMAND_ID } from "~/modules/command/commands/id"
import {
  useWrappedElementPosition,
  useWrappedElementSize,
} from "~/providers/wrapped-element-provider"

import { MarkdownRenderContainerRefContext } from "../context"
import { useScrollTracking, useTocItems } from "./hooks"
import type { TocItemProps } from "./TocItem"
import { TocItem } from "./TocItem"

export interface ITocItem {
  depth: number
  title: string
  anchorId: string
  index: number

  $heading: HTMLHeadingElement
}

export interface TocProps {
  onItemClick?: (index: number, $el: HTMLElement | null, anchorId: string) => void
}

const WiderTocStyle = {
  width: 200,
} satisfies React.CSSProperties
export interface TocRef {
  refreshItems: () => void
}
export const Toc = ({
  ref,
  className,
  onItemClick,
}: ComponentType<TocProps> & { ref?: React.Ref<TocRef | null> }) => {
  const markdownElement = use(MarkdownRenderContainerRefContext)
  const { toc, rootDepth, refreshItems } = useTocItems(markdownElement)
  const { currentScrollRange, handleScrollTo } = useScrollTracking(toc, {
    onItemClick,
  })

  useImperativeHandle(
    ref,
    useCallback(() => {
      return {
        refreshItems,
      }
    }, [refreshItems]),
  )

  const renderContentElementPosition = useWrappedElementPosition()
  const renderContentElementSize = useWrappedElementSize()
  const entryContentInWideMode = useRealInWideMode()
  const shouldShowTitle = useViewport((v) => {
    if (!entryContentInWideMode) return false
    const { w } = v
    const xAxis = renderContentElementPosition.x + renderContentElementSize.w

    return w - xAxis > WiderTocStyle.width + 50
  })

  if (toc.length === 0) return null

  return shouldShowTitle ? (
    <TocContainer
      className={className}
      toc={toc}
      rootDepth={rootDepth}
      currentScrollRange={currentScrollRange}
      handleScrollTo={handleScrollTo}
    />
  ) : (
    <TocHoverCard
      className={className}
      toc={toc}
      rootDepth={rootDepth}
      currentScrollRange={currentScrollRange}
      handleScrollTo={handleScrollTo}
    />
  )
}

const TocContainer: React.FC<TocContainerProps> = ({
  className,
  toc,
  rootDepth,
  currentScrollRange,
  handleScrollTo,
}) => {
  return (
    <div
      className={cn(
        "scrollbar-none group relative overflow-auto opacity-60 duration-200 group-hover:opacity-100",
        "flex flex-col",
        className,
      )}
      style={WiderTocStyle}
    >
      {toc.map((heading, index) => (
        <MemoedItem
          variant="title-line"
          heading={heading}
          key={heading.anchorId}
          rootDepth={rootDepth}
          onClick={handleScrollTo}
          isScrollOut={index < currentScrollRange[0]}
          range={index === currentScrollRange[0] ? currentScrollRange[1] : 0}
        />
      ))}
    </div>
  )
}

const TocHoverCard: React.FC<TocHoverCardProps> = ({
  className,
  toc,
  rootDepth,
  currentScrollRange,
  handleScrollTo,
}) => {
  const [hoverShow, setHoverShow] = useState(false)

  return (
    <div className="scrollbar-none flex grow flex-col scroll-smooth px-2">
      <HoverCard.Root openDelay={100} open={hoverShow} onOpenChange={setHoverShow}>
        <HoverCard.Trigger asChild>
          <div
            className={cn(
              "scrollbar-none group overflow-auto opacity-60 duration-200 group-hover:opacity-100",
              className,
            )}
          >
            {toc.map((heading, index) => (
              <MemoedItem
                heading={heading}
                key={heading.anchorId}
                rootDepth={rootDepth}
                onClick={handleScrollTo}
                isScrollOut={index < currentScrollRange[0]}
                range={index === currentScrollRange[0] ? currentScrollRange[1] : 0}
              />
            ))}
          </div>
        </HoverCard.Trigger>
        <HoverCard.Portal forceMount>
          <div>
            <AnimatePresence>
              {hoverShow && (
                <HoverCard.Content side="left" align="start" asChild>
                  <m.ul
                    initial={{ opacity: 0, x: 110 }}
                    animate={{ opacity: 1, x: 100 }}
                    exit={{ opacity: 0, x: 110, transition: { duration: 0.1 } }}
                    transition={{ duration: 0.5, type: "spring" }}
                    className={cn(
                      "relative z-10 -mt-1 rounded-xl border",
                      "px-3 py-1 text-xs",
                      "bg-material-ultra-thick backdrop-blur-background shadow-context-menu",
                      "scrollbar-none max-h-[calc(100svh-4rem)] overflow-auto",
                    )}
                  >
                    {toc.map((heading, index) => (
                      <li
                        key={heading.anchorId}
                        className="flex w-full items-center"
                        style={{ paddingLeft: `${(heading.depth - rootDepth) * 12}px` }}
                      >
                        <button
                          tabIndex={1}
                          className={cn(
                            "group flex w-full cursor-pointer justify-between py-1",
                            index === currentScrollRange[0] ? "text-accent" : "",
                          )}
                          type="button"
                          onClick={() => {
                            handleScrollTo(index, heading.$heading, heading.anchorId)
                            nextFrame(() => {
                              EventBus.dispatch(COMMAND_ID.layout.focusToEntryRender, {
                                highlightBoundary: false,
                              })
                            })
                          }}
                        >
                          <EllipsisHorizontalTextWithTooltip className="group-hover:text-accent/80 max-w-prose select-none truncate duration-200">
                            {heading.title}
                          </EllipsisHorizontalTextWithTooltip>

                          <span className="ml-4 select-none text-[8px] opacity-50">
                            H{heading.depth}
                          </span>
                        </button>
                      </li>
                    ))}
                  </m.ul>
                </HoverCard.Content>
              )}
            </AnimatePresence>
          </div>
        </HoverCard.Portal>
      </HoverCard.Root>
    </div>
  )
}

const MemoedItem = memo<TocItemProps>((props) => {
  const {
    // active,
    range,
    ...rest
  } = props
  const active = range > 0

  const itemRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!active) return

    const $item = itemRef.current
    if (!$item) return
    const $container = $item.parentElement
    if (!$container) return

    const containerHeight = $container.clientHeight
    const itemHeight = $item.clientHeight
    const itemOffsetTop = $item.offsetTop
    const { scrollTop } = $container

    const itemTop = itemOffsetTop - scrollTop
    const itemBottom = itemTop + itemHeight
    if (itemTop < 0 || itemBottom > containerHeight) {
      $container.scrollTop = itemOffsetTop - containerHeight / 2 + itemHeight / 2
    }
  }, [active])

  return <TocItem range={range} {...rest} />
})
MemoedItem.displayName = "MemoedItem"

// Types
interface TocContainerProps {
  className?: string
  toc: ITocItem[]
  rootDepth: number
  currentScrollRange: [number, number]
  handleScrollTo: (i: number, $el: HTMLElement | null, anchorId: string) => void
}

interface TocHoverCardProps extends TocContainerProps {}

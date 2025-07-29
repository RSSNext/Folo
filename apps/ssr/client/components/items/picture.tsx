import { LazyImage } from "@client/components/ui/image"
import { getPreferredTitle } from "@client/lib/helper"
import type { EntriesPreview } from "@client/query/entries"
import type { Feed } from "@client/query/feed"
import { MemoedDangerousHTMLStyle } from "@follow/components/common/MemoedDangerousHTMLStyle.jsx"
import { TitleMarquee } from "@follow/components/ui/marquee/index.jsx"
import {
  MasonryItemsAspectRatioContext,
  MasonryItemsAspectRatioSetterContext,
  MasonryItemWidthContext,
  useMasonryItemRatio,
  useMasonryItemWidth,
  useSetStableMasonryItemRatio,
} from "@follow/components/ui/masonry/contexts.jsx"
import { Masonry } from "@follow/components/ui/masonry/index.jsx"
import { nextFrame } from "@follow/utils/dom"
import { cn } from "@follow/utils/utils"
import dayjs from "dayjs"
import { throttle } from "es-toolkit/compat"
import type { RenderComponentProps } from "masonic"
import { AnimatePresence, m } from "motion/react"
import type { FC, PropsWithChildren } from "react"
import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { PhotoProvider, PhotoView } from "react-photo-view"
import inlineStyle from "react-photo-view/dist/react-photo-view.css?raw"

import { FeedIcon } from "../ui/feed-icon"

const MasonryItemFixedDimensionWrapper = (
  props: PropsWithChildren<{
    url: string
    ratio?: number
    height?: number
  }>,
) => {
  const { url, children, ratio } = props
  const itemWidth = useMasonryItemWidth()

  const itemHeight = ratio ? itemWidth * ratio : itemWidth
  const stableRadio = useState(() => itemWidth / itemHeight || 1)[0]
  const setItemStableRatio = useSetStableMasonryItemRatio()

  const stableRadioCtx = useMasonryItemRatio(url)

  useEffect(() => {
    setItemStableRatio(url, stableRadio)
  }, [setItemStableRatio, stableRadio, url])

  const style = useMemo(
    () => ({
      width: itemWidth,
      height: itemWidth / stableRadioCtx!,
    }),
    [itemWidth, stableRadioCtx],
  )

  if (!style.height) return null

  return (
    <div className="relative flex h-full overflow-hidden" style={style}>
      {children}
    </div>
  )
}

const maskStyle = {
  maskImage: "linear-gradient(rgba(255, 255, 255, 0) 0%, rgb(255, 255, 255) 10px)",
}

const breakpoints = {
  0: 1,
  // 32rem => 32 * 16= 512
  512: 2,
  // 48rem => 48 * 16= 768
  768: 3,
  // 72rem => 72 * 16= 1152
  976: 4,
  // 80rem => 80 * 16= 1280
  1280: 5,
  1536: 6,
  1792: 7,
  2048: 8,
}
const getCurrentColumn = (w: number) => {
  // Initialize column count with the minimum number of columns
  let columns = 1

  // Iterate through each breakpoint and determine the column count
  for (const [breakpoint, cols] of Object.entries(breakpoints)) {
    if (w >= Number.parseInt(breakpoint)) {
      columns = cols
    } else {
      break
    }
  }

  return columns
}
export const PictureList: FC<{
  entries: EntriesPreview

  feed?: Feed
}> = ({ entries, feed }) => {
  const [masonryItemsRadio, setMasonryItemsRadio] = useState<Record<string, number>>({})
  const [currentItemWidth, setCurrentItemWidth] = useState(0)
  const [currentColumn, setCurrentColumn] = useState(1)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isInitLayout, setIsInitLayout] = useState(false)

  const xGutter = currentColumn === 1 ? 0 : 12
  const yGutter = 12
  useLayoutEffect(() => {
    const $warpper = containerRef.current
    if (!$warpper) return
    const handler = () => {
      const column = getCurrentColumn($warpper.clientWidth)

      setCurrentItemWidth(Math.trunc($warpper.clientWidth / column - xGutter))

      setCurrentColumn(column)

      nextFrame(() => {
        setIsInitLayout(true)
      })
    }
    const recal = throttle(handler, 1000 / 12)

    let previousWidth = $warpper.offsetWidth
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newWidth = entry.contentRect.width

        if (newWidth !== previousWidth) {
          previousWidth = newWidth

          recal()
        }
      }
    })
    recal()
    resizeObserver.observe($warpper)
    return () => {
      resizeObserver.disconnect()
    }
  }, [xGutter])

  const items = useMemo(() => {
    const flattenedItems = []
    const imageSrcSet = new Set<string>()
    for (let i = 0; i < entries?.length || 0; i++) {
      const entry = entries[i]!
      if (!entry.media) continue
      for (let j = 0; j < entry.media?.length || 0; j++) {
        const media = entry.media[j]!
        if (imageSrcSet.has(media.url)) continue
        imageSrcSet.add(media.url)

        flattenedItems.push({
          url: media.url,
          height: media.height,
          width: media.width,
          id: entry.id,
          blurhash: media.blurhash,

          entry,
          feed,
        })
      }
    }
    return flattenedItems
  }, [entries, feed])

  return (
    <PhotoProvider>
      <div className="relative flex min-w-0 px-2 lg:px-6">
        <MemoedDangerousHTMLStyle>{inlineStyle}</MemoedDangerousHTMLStyle>
        <div className="flex w-full flex-wrap" ref={containerRef}>
          {isInitLayout && (
            <MasonryItemWidthContext value={currentItemWidth}>
              {/* eslint-disable-next-line @eslint-react/no-context-provider */}
              <MasonryItemsAspectRatioContext.Provider value={masonryItemsRadio}>
                <MasonryItemsAspectRatioSetterContext value={setMasonryItemsRadio}>
                  <div className="relative w-full">
                    <Masonry
                      items={items}
                      columnGutter={yGutter}
                      columnWidth={currentItemWidth}
                      columnCount={currentColumn}
                      overscanBy={2}
                      render={render}
                      itemKey={itemKey}
                    />
                  </div>
                </MasonryItemsAspectRatioSetterContext>
              </MasonryItemsAspectRatioContext.Provider>
            </MasonryItemWidthContext>
          )}
        </div>
      </div>
    </PhotoProvider>
  )
}

const itemKey = (item: { url: string }) => item.url
const render: React.ComponentType<
  RenderComponentProps<{
    url: string
    height: number | undefined
    width: number | undefined
    blurhash: string | undefined
    id: string
    entry: EntriesPreview[number]
    feed?: Feed
  }>
> = memo(({ data }) => {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <MasonryItemFixedDimensionWrapper
      url={data.url}
      key={data.id}
      height={data.height}
      ratio={data.height && data.width ? data.height / data.width : undefined}
    >
      <div
        className="size-full overflow-hidden rounded-md"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <PhotoView src={data.url}>
          <LazyImage
            src={data.url}
            height={data.height}
            width={data.width}
            blurhash={data.blurhash}
            className="duration-200 hover:scale-105"
          />
        </PhotoView>

        <AnimatePresence>
          {isHovered && (
            <m.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute inset-x-0 -bottom-px z-[3] overflow-hidden rounded-b-md pb-1"
              key="footer"
            >
              <div className="absolute inset-x-0 bottom-0 h-[56px]" style={maskStyle}>
                <div className="absolute inset-x-0 bottom-0 h-[76px] bg-gradient-to-t from-black/80 to-transparent" />
              </div>
              <GridItemFooter
                entry={data.entry}
                feed={data.feed}
                titleClassName="!text-white"
                descriptionClassName="!text-white/80"
                timeClassName="!text-white/60"
              />
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </MasonryItemFixedDimensionWrapper>
  )
})
const GridItemFooter = ({
  entry,

  titleClassName,
  descriptionClassName,
  timeClassName,
  feed,
}: {
  entry: EntriesPreview[number]
  feed?: Feed
  titleClassName?: string
  descriptionClassName?: string
  timeClassName?: string
}) => {
  return (
    <div className={cn("relative px-2 py-1 text-sm")}>
      <div className="flex items-center">
        <div className={"bg-accent mr-1 size-1.5 shrink-0 self-center rounded-full duration-200"} />
        <div
          className={cn(
            "relative mb-1 mt-1.5 flex w-full items-center gap-1 truncate font-medium",
            titleClassName,
          )}
        >
          <TitleMarquee className="min-w-0 grow">{entry.title}</TitleMarquee>
        </div>
      </div>
      <div className="flex items-center gap-1 truncate text-[13px]">
        <FeedIcon
          fallback
          className="mr-0.5 flex"
          feed={feed?.feed || entry.feeds}
          entry={entry}
          size={18}
        />
        <span className={cn("min-w-0 truncate", descriptionClassName)}>
          {getPreferredTitle(feed?.feed || entry.feeds)}
        </span>
        <span className={cn("text-zinc-500", timeClassName)}>·</span>
        <span className={cn("text-zinc-500", timeClassName)}>
          {dayjs.duration(dayjs(entry.publishedAt).diff(dayjs(), "minute"), "minute").humanize()}
        </span>
      </div>
    </div>
  )
}

import { Skeleton } from "@follow/components/ui/skeleton/index.jsx"
import { IN_ELECTRON } from "@follow/shared/constants"
import { useEntry } from "@follow/store/entry/hooks"
import { formatDuration } from "@follow/utils/duration"
import { transformVideoUrl } from "@follow/utils/url-for-video"
import { cn } from "@follow/utils/utils"
import { useHover } from "@use-gesture/react"
import { useEffect, useMemo, useRef, useState } from "react"

import { RelativeTime } from "~/components/ui/datetime"
import { Media } from "~/components/ui/media/Media"
import { useRouteParamsSelector } from "~/hooks/biz/useRouteParams"
import { FeedIcon } from "~/modules/feed/feed-icon"
import { FeedTitle } from "~/modules/feed/feed-title"

import { GridItem } from "../templates/grid-item-template"
import type { EntryItemStatelessProps, UniversalItemProps } from "../types"

const ViewTag = IN_ELECTRON ? "webview" : "iframe"

export function VideoItem({ entryId, entryPreview, translation }: UniversalItemProps) {
  const entry = useEntry(entryId, (state) => {
    const { id, url } = state

    const attachments = state.attachments || []
    const { duration_in_seconds } =
      attachments?.find((attachment) => attachment.duration_in_seconds) ?? {}
    const seconds = duration_in_seconds
      ? Number.parseInt(duration_in_seconds.toString())
      : undefined
    const duration = formatDuration(seconds)

    const media = state.media || []
    const firstMedia = media[0]

    return { attachments, duration, firstMedia, id, url, media }
  })

  const isActive = useRouteParamsSelector(({ entryId }) => entryId === entry?.id)

  const [miniIframeSrc] = useMemo(
    () => [
      transformVideoUrl({
        url: entry?.url ?? "",
        mini: true,
        isIframe: !IN_ELECTRON,
        attachments: entry?.attachments,
      }),
      transformVideoUrl({
        url: entry?.url ?? "",
        isIframe: !IN_ELECTRON,
        attachments: entry?.attachments,
      }),
    ],
    [entry?.attachments, entry?.url],
  )

  const ref = useRef<HTMLDivElement>(null)
  const [hovered, setHovered] = useState(false)
  useHover(
    (event) => {
      setHovered(event.active)
    },
    {
      target: ref,
    },
  )

  const [showPreview, setShowPreview] = useState(false)
  useEffect(() => {
    if (hovered) {
      const timer = setTimeout(() => {
        setShowPreview(true)
      }, 500)
      return () => clearTimeout(timer)
    } else {
      setShowPreview(false)
      return () => {}
    }
  }, [hovered])

  if (!entry) return null
  return (
    <GridItem entryId={entryId} entryPreview={entryPreview} translation={translation}>
      <div className="cursor-card w-full">
        <div className="relative overflow-x-auto" ref={ref}>
          {miniIframeSrc && showPreview ? (
            <ViewTag
              src={miniIframeSrc}
              className={cn(
                "pointer-events-none aspect-video w-full shrink-0 rounded-md bg-black object-cover",
                isActive && "rounded-b-none",
              )}
            />
          ) : entry.firstMedia ? (
            <Media
              key={entry.firstMedia.url}
              src={entry.firstMedia.url}
              type={entry.firstMedia.type}
              previewImageUrl={entry.firstMedia.preview_image_url}
              className={cn(
                "aspect-video w-full shrink-0 rounded-md object-cover",
                isActive && "rounded-b-none",
              )}
              loading="lazy"
              proxy={{
                width: 640,
                height: 360,
              }}
              showFallback={true}
            />
          ) : (
            <div className="center bg-material-medium text-text-secondary aspect-video w-full flex-col gap-1 rounded-md text-xs">
              <i className="i-mgc-sad-cute-re size-6" />
              No media available
            </div>
          )}
          {!!entry.duration && (
            <div className="absolute bottom-2 right-2 rounded-md bg-black/50 px-1 py-0.5 text-xs font-medium text-white">
              {entry.duration}
            </div>
          )}
        </div>
      </div>
    </GridItem>
  )
}

export function VideoItemStateLess({ entry, feed }: EntryItemStatelessProps) {
  return (
    <div className="text-text relative mx-auto w-full max-w-lg rounded-md transition-colors">
      <div className="relative">
        <div className="p-1.5">
          <div className="w-full">
            <div className="overflow-x-auto">
              {entry.media?.[0] ? (
                <Media
                  thumbnail
                  src={entry.media[0].url}
                  type={entry.media[0].type}
                  previewImageUrl={entry.media[0].preview_image_url}
                  className="aspect-video w-full shrink-0 overflow-hidden"
                  mediaContainerClassName={"w-auto h-auto rounded"}
                  loading="lazy"
                  proxy={{
                    width: 0,
                    height: 0,
                  }}
                  height={entry.media[0].height}
                  width={entry.media[0].width}
                  blurhash={entry.media[0].blurhash}
                />
              ) : (
                <Skeleton className="aspect-video w-full shrink-0 overflow-hidden" />
              )}
            </div>
          </div>
          <div className="relative flex-1 px-2 pb-3 pt-1 text-sm">
            <div className="relative mb-1 mt-1.5 truncate font-medium leading-none">
              {entry.title}
            </div>
            <div className="text-text-secondary mt-1 flex items-center gap-1 truncate text-[13px]">
              <FeedIcon feed={feed} fallback className="size-4" />
              <FeedTitle feed={feed} />
              <span className="text-material-opaque">·</span>
              {!!entry.publishedAt && <RelativeTime date={entry.publishedAt} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export const VideoItemSkeleton = (
  <div className="relative mx-auto w-full max-w-lg rounded-md">
    <div className="relative">
      <div className="p-1.5">
        <div className="w-full">
          <div className="overflow-x-auto">
            <Skeleton className="aspect-video w-full shrink-0 overflow-hidden" />
          </div>
        </div>
        <div className="relative flex-1 px-2 pb-3 pt-1 text-sm">
          <div className="relative mb-1 mt-1.5 truncate font-medium leading-none">
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="mt-1 flex items-center gap-1 truncate text-[13px]">
            <Skeleton className="mr-0.5 size-4" />
            <Skeleton className="h-3 w-1/2" />
            <span className="text-material-opaque">·</span>
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
      </div>
    </div>
  </div>
)

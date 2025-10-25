import { PassviseFragment } from "@follow/components/common/Fragment.js"
import { AutoResizeHeight } from "@follow/components/ui/auto-resize-height/index.js"
import { Skeleton } from "@follow/components/ui/skeleton/index.jsx"
import { useIsEntryStarred } from "@follow/store/collection/hooks"
import { useEntry } from "@follow/store/entry/hooks"
import { useFeedById } from "@follow/store/feed/hooks"
import { LRUCache } from "@follow/utils/lru-cache"
import { cn } from "@follow/utils/utils"
import { useLayoutEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { useGeneralSettingKey } from "~/atoms/settings/general"
import { RelativeTime } from "~/components/ui/datetime"
import { HTML } from "~/components/ui/markdown/HTML"
import { Media } from "~/components/ui/media/Media"
import { useEntryIsRead } from "~/hooks/biz/useAsRead"
import { useRenderStyle } from "~/hooks/biz/useRenderStyle"
import { jotaiStore } from "~/lib/jotai"
import { parseSocialMedia } from "~/lib/parsers"
import type { FeedIconEntry } from "~/modules/feed/feed-icon"
import { FeedIcon } from "~/modules/feed/feed-icon"
import { FeedTitle } from "~/modules/feed/feed-title"

import { socialMediaContentWidthAtom } from "../atoms/social-media-content-width"
import { StarIcon } from "../star-icon"
import { readableContentMaxWidth } from "../styles"
import type { EntryItemStatelessProps, EntryListItemFC } from "../types"
import { MediaGallery } from "./media-gallery"

export const SocialMediaItem: EntryListItemFC = ({ entryId, translation }) => {
  const entry = useEntry(entryId, (state) => {
    /// keep-sorted
    const {
      author,
      authorAvatar,
      authorUrl,
      content,
      description,
      feedId,
      guid,
      publishedAt,
      url,
    } = state

    const media = state.media || []
    const photo = media.find((a) => a.type === "photo")
    const firstPhotoUrl = photo?.url

    /// keep-sorted
    return {
      author,
      authorAvatar,
      authorUrl,
      content,
      description,
      feedId,
      firstPhotoUrl,
      guid,
      publishedAt,
      url,
    }
  })

  const isInCollection = useIsEntryStarred(entryId)

  const asRead = useEntryIsRead(entryId)
  const feed = useFeedById(entry?.feedId)

  const iconEntry: FeedIconEntry = useMemo(
    () => ({
      firstPhotoUrl: entry?.firstPhotoUrl,
      authorAvatar: entry?.authorAvatar,
    }),
    [entry?.firstPhotoUrl, entry?.authorAvatar],
  )

  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (ref.current) {
      jotaiStore.set(socialMediaContentWidthAtom, ref.current.offsetWidth)
    }
  }, [])
  const autoExpandLongSocialMedia = useGeneralSettingKey("autoExpandLongSocialMedia")
  const renderStyle = useRenderStyle({ baseFontSize: 14, baseLineHeight: 1.625 })

  const titleRef = useRef<HTMLDivElement>(null)
  if (!entry || !feed) return null

  const content = entry.content || entry.description

  const parsed = parseSocialMedia(entry.authorUrl || entry.url || entry.guid)
  const EntryContentWrapper = autoExpandLongSocialMedia
    ? PassviseFragment
    : CollapsedSocialMediaItem

  return (
    <div
      className={cn(
        "relative flex py-4",
        "group",
        !asRead &&
          "before:absolute before:-left-3 before:top-8 before:block before:size-2 before:rounded-full before:bg-accent",
      )}
    >
      <FeedIcon fallback target={feed} entry={iconEntry} size={32} className="mt-1" />
      <div ref={ref} className="ml-2 min-w-0 flex-1">
        <div className="-mt-0.5 flex-1 text-sm">
          <div className="flex select-none flex-wrap space-x-1 leading-6" ref={titleRef}>
            <span className="inline-flex min-w-0 items-center gap-1 text-base font-semibold">
              <FeedTitle feed={feed} title={entry.author || feed.title} />
              {parsed?.type === "x" && (
                <i className="i-mgc-twitter-cute-fi size-3 text-[#4A99E9]" />
              )}
            </span>

            {parsed?.type === "x" && (
              <a
                href={`https://x.com/${parsed.meta.handle}`}
                target="_blank"
                className="text-zinc-500"
              >
                @{parsed.meta.handle}
              </a>
            )}
            <span className="text-zinc-500">·</span>
            <span className="text-zinc-500">
              <RelativeTime date={entry.publishedAt} />
            </span>
          </div>
          <div className={cn("relative mt-1 text-base", isInCollection && "pr-5")}>
            <EntryContentWrapper entryId={entryId}>
              <HTML
                as="div"
                className={cn(
                  "prose align-middle dark:prose-invert",
                  "cursor-auto select-text text-sm leading-relaxed prose-blockquote:mt-0",
                )}
                noMedia
                style={renderStyle}
              >
                {translation?.content || content}
              </HTML>
            </EntryContentWrapper>
            {isInCollection && <StarIcon className="absolute right-0 top-0" />}
          </div>
        </div>
        <MediaGallery entryId={entryId} />
      </div>
    </div>
  )
}

SocialMediaItem.wrapperClassName = cn(
  readableContentMaxWidth,
  "pl-4 pr-3 @[700px]:pl-6 @[1024px]:pr-4",
)

export function SocialMediaItemStateLess({ entry, feed }: EntryItemStatelessProps) {
  return (
    <div className="relative flex py-4">
      <FeedIcon fallback target={feed} size={32} className="mr-2 mt-1" />
      <div className="min-w-0 flex-1">
        <div className="-mt-0.5 flex-1 text-sm">
          <div className="flex select-none flex-wrap space-x-1 leading-6">
            <span className="inline-flex min-w-0 items-center gap-1 text-base font-semibold">
              <FeedTitle feed={feed} />
            </span>
            <span className="text-zinc-500">·</span>
            <span className="text-zinc-500">
              <RelativeTime date={entry.publishedAt} />
            </span>
          </div>
          <div className="relative mt-1 text-base">
            <div className="prose cursor-auto select-text truncate align-middle text-sm leading-relaxed dark:prose-invert prose-blockquote:mt-0">
              {entry.description}
            </div>
          </div>
        </div>
        {entry.media && entry.media.length > 0 && (
          <div className="mt-4 flex gap-[8px] overflow-x-auto pb-2">
            {entry.media.slice(0, 3).map((media) => (
              <Media
                key={media.url}
                thumbnail
                src={media.url}
                type={media.type}
                previewImageUrl={media.preview_image_url}
                className="size-28 shrink-0 rounded object-cover"
                mediaContainerClassName="w-auto h-auto rounded"
                loading="lazy"
                proxy={{
                  width: 160,
                  height: 160,
                }}
                height={media.height}
                width={media.width}
                blurhash={media.blurhash}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export const SocialMediaItemSkeleton = (
  <div className={`relative m-auto rounded-md ${readableContentMaxWidth}`}>
    <div className="relative">
      <div className="group relative flex py-6">
        <Skeleton className="mr-2 size-9" />
        <div className="ml-2 min-w-0 flex-1">
          <div className="-mt-0.5 line-clamp-5 flex-1 text-sm">
            <div className="flex w-[calc(100%-10rem)] space-x-1">
              <Skeleton className="h-4 w-16" />
              <span className="text-material-opaque">·</span>
              <Skeleton className="h-4 w-12" />
            </div>
            <div className="relative mt-0.5 text-sm">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="mt-1.5 h-4 w-full" />
              <Skeleton className="mt-1.5 h-4 w-3/4" />
            </div>
          </div>
          <div className="mt-2 flex gap-2 overflow-x-auto">
            <Skeleton className="size-28 overflow-hidden rounded" />
          </div>
        </div>
      </div>
    </div>
  </div>
)

const collapsedHeight = 300
const collapsedItemCache = new LRUCache<string, boolean>(100)
const CollapsedSocialMediaItem: Component<{
  entryId: string
}> = ({ children, entryId }) => {
  const { t } = useTranslation()
  const [isOverflow, setIsOverflow] = useState(false)
  const [isShowMore, setIsShowMore] = useState(() => collapsedItemCache.get(entryId) ?? false)
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (ref.current) {
      setIsOverflow(ref.current.scrollHeight > collapsedHeight)
    }
  }, [children])

  return (
    <AutoResizeHeight className="relative">
      <div
        className={cn(
          "relative",
          !isShowMore && "max-h-[300px] overflow-hidden",
          isShowMore && "h-auto",
          !isShowMore && isOverflow && "mask-b-2xl",
        )}
        ref={ref}
      >
        {children}
      </div>
      {isOverflow && !isShowMore && (
        <div className="absolute inset-x-0 -bottom-2 flex select-none justify-center py-2 duration-200">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setIsShowMore(true)
              collapsedItemCache.put(entryId, true)
            }}
            aria-hidden
            className="flex items-center justify-center text-xs duration-200 hover:text-text"
          >
            <i className="i-mingcute-arrow-to-down-line" />
            <span className="ml-2">{t("words.show_more")}</span>
          </button>
        </div>
      )}
    </AutoResizeHeight>
  )
}

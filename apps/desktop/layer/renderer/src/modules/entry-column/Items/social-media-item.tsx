import { useGlobalFocusableScopeSelector } from "@follow/components/common/Focusable/hooks.js"
import { PassviseFragment } from "@follow/components/common/Fragment.js"
import { Spring } from "@follow/components/constants/spring.js"
import { AutoResizeHeight } from "@follow/components/ui/auto-resize-height/index.js"
import { Skeleton } from "@follow/components/ui/skeleton/index.jsx"
import { FeedViewType } from "@follow/constants"
import { useIsEntryStarred } from "@follow/store/collection/hooks"
import { useEntry } from "@follow/store/entry/hooks"
import { useFeedById } from "@follow/store/feed/hooks"
import { getImageProxyUrl } from "@follow/utils/img-proxy"
import { LRUCache } from "@follow/utils/lru-cache"
import { cn } from "@follow/utils/utils"
import { atom } from "jotai"
import { AnimatePresence, m } from "motion/react"
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { useGeneralSettingKey } from "~/atoms/settings/general"
import { FocusablePresets } from "~/components/common/Focusable"
import { RelativeTime } from "~/components/ui/datetime"
import { HTML } from "~/components/ui/markdown/HTML"
import { usePreviewMedia } from "~/components/ui/media/hooks"
import { Media } from "~/components/ui/media/Media"
import { useEntryIsRead } from "~/hooks/biz/useAsRead"
import { useSortedEntryActions } from "~/hooks/biz/useEntryActions"
import { useRenderStyle } from "~/hooks/biz/useRenderStyle"
import { jotaiStore } from "~/lib/jotai"
import { parseSocialMedia } from "~/lib/parsers"
import { EntryHeaderActions } from "~/modules/entry-content/actions/header-actions"
import { MoreActions } from "~/modules/entry-content/actions/more-actions"
import type { FeedIconEntry } from "~/modules/feed/feed-icon"
import { FeedIcon } from "~/modules/feed/feed-icon"
import { FeedTitle } from "~/modules/feed/feed-title"

import { StarIcon } from "../star-icon"
import type { EntryItemStatelessProps, EntryListItemFC } from "../types"

const socialMediaContentWidthAtom = atom(0)
export const SocialMediaItem: EntryListItemFC = ({ entryId, translation }) => {
  const entry = useEntry(entryId, (state) => {
    const { feedId, read } = state
    const { author, authorAvatar, authorUrl, content, description, guid, publishedAt, url } = state

    const media = state.media || []
    const photo = media.find((a) => a.type === "photo")
    const firstPhotoUrl = photo?.url
    const iconEntry: FeedIconEntry = {
      firstPhotoUrl,
      authorAvatar,
    }

    return {
      author,
      authorUrl,
      content,
      description,
      feedId,
      guid,
      iconEntry,
      publishedAt,
      read,
      url,
    }
  })
  const isInCollection = useIsEntryStarred(entryId)

  const asRead = useEntryIsRead(entry)
  const feed = useFeedById(entry?.feedId)

  const ref = useRef<HTMLDivElement>(null)
  const [showAction, setShowAction] = useState(false)

  const handleMouseEnter = useMemo(() => {
    return () => setShowAction(true)
  }, [])
  const handleMouseLeave = useMemo(() => {
    return (e: React.MouseEvent) => {
      // If the mouse is over the action bar, don't hide the action bar
      const relatedTarget = e.relatedTarget as Element
      const currentTarget = e.currentTarget as Element

      if (relatedTarget && currentTarget.contains(relatedTarget)) {
        return
      }
      setShowAction(false)
    }
  }, [])

  const isDropdownMenuOpen = useGlobalFocusableScopeSelector(
    FocusablePresets.isNotFloatingLayerScope,
  )

  useEffect(() => {
    // Hide the action bar when dropdown menu is open and click outside
    if (isDropdownMenuOpen) {
      setShowAction(false)
    }
  }, [isDropdownMenuOpen])

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
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "relative flex px-5 py-4 first:mt-6 lg:px-8",
        "group",
        !asRead &&
          "before:bg-accent before:absolute before:left-1 before:top-8 before:block before:size-2 before:rounded-full md:before:-left-2 lg:before:left-2",
      )}
    >
      <FeedIcon fallback feed={feed} entry={entry.iconEntry} size={32} className="mt-1" />
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
                  "prose dark:prose-invert align-middle",
                  "prose-blockquote:mt-0 cursor-auto select-text text-sm leading-relaxed",
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
        <SocialMediaGallery entryId={entryId} />
      </div>

      <AnimatePresence>{showAction && <ActionBar entryId={entryId} />}</AnimatePresence>
    </div>
  )
}

SocialMediaItem.wrapperClassName = tw`w-[645px] max-w-full m-auto`

const ActionBar = ({ entryId }: { entryId: string }) => {
  const { mainAction: entryActions } = useSortedEntryActions({
    entryId,
    view: FeedViewType.SocialMedia,
  })

  if (entryActions.length === 0) return null

  return (
    <m.div
      initial={{ opacity: 0, scale: 0.9, y: "-1/2" }}
      animate={{ opacity: 1, scale: 1, y: "-1/2" }}
      exit={{ opacity: 0, scale: 0.9, y: "-1/2" }}
      transition={Spring.presets.smooth}
      className="absolute right-1 top-0 -translate-y-1/2 rounded-lg border border-gray-200 bg-white/90 p-1 shadow-sm backdrop-blur-sm dark:border-neutral-900 dark:bg-neutral-900"
    >
      <div className="flex items-center gap-1">
        <EntryHeaderActions entryId={entryId} view={FeedViewType.SocialMedia} />
        <MoreActions entryId={entryId} view={FeedViewType.SocialMedia} />
      </div>
    </m.div>
  )
}

export function SocialMediaItemStateLess({ entry, feed }: EntryItemStatelessProps) {
  return (
    <div className="relative select-none rounded-md text-zinc-700 transition-colors dark:text-neutral-400">
      <div className="relative">
        <div className="group relative flex px-8 py-6">
          <FeedIcon className="mr-2 size-9" feed={feed} fallback />
          <div className="ml-2 min-w-0 flex-1">
            <div className="-mt-0.5 line-clamp-5 flex-1 text-sm">
              <div className="flex space-x-1">
                <FeedTitle feed={feed} />
                <span className="text-zinc-500">·</span>
                <span>{!!entry.publishedAt && <RelativeTime date={entry.publishedAt} />}</span>
              </div>
              <div className="relative mt-0.5 text-sm">{entry.description}</div>
            </div>
            <div className="mt-2 flex gap-2 overflow-x-auto">
              {entry.media?.slice(0, 2).map((media) => (
                <Media
                  key={media.url}
                  thumbnail
                  src={media.url}
                  type={media.type}
                  previewImageUrl={media.preview_image_url}
                  className="size-28 overflow-hidden rounded"
                  mediaContainerClassName={"w-auto h-auto rounded"}
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
          </div>
        </div>
      </div>
    </div>
  )
}

export const SocialMediaItemSkeleton = (
  <div className="relative m-auto w-[645px] rounded-md">
    <div className="relative">
      <div className="group relative flex px-8 py-6">
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

const SocialMediaGallery = ({ entryId }: { entryId: string }) => {
  const entry = useEntry(entryId, (state) => ({ media: state.media }))
  const media = useMemo(() => entry?.media || [], [entry?.media])

  const previewMedia = usePreviewMedia()

  const isAllMediaSameRatio = useMemo(() => {
    let ratio = 0
    for (const m of media) {
      if (m?.height && m?.width) {
        const currentRatio = m.height / m.width
        if (ratio === 0) {
          ratio = currentRatio
        } else if (ratio !== currentRatio) {
          return false
        }
      } else {
        return false
      }
    }
    return true
  }, [media])

  if (media.length === 0) return null

  // all media has same ratio, use horizontal layout
  if (isAllMediaSameRatio) {
    return (
      <div className="mt-4 flex gap-[8px] overflow-x-auto pb-2">
        {media.map((media, i, mediaList) => {
          const style: Partial<{
            width: string
            height: string
          }> = {}
          const boundsWidth = jotaiStore.get(socialMediaContentWidthAtom)
          if (media.height && media.width) {
            // has 1 picture, max width is container width, but max height is less than window height: 2/3
            if (mediaList.length === 1) {
              style.width = `${boundsWidth}px`
              style.height = `${(boundsWidth * media.height) / media.width}px`
              if (Number.parseInt(style.height) > (window.innerHeight * 2) / 3) {
                style.height = `${(window.innerHeight * 2) / 3}px`
                style.width = `${(Number.parseInt(style.height) * media.width) / media.height}px`
              }
            }
            // has 2 pictures, max width is container half width, and - gap 8px
            else if (mediaList.length === 2) {
              style.width = `${(boundsWidth - 8) / 2}px`
              style.height = `${(((boundsWidth - 8) / 2) * media.height) / media.width}px`
            }
            // has over 2 pictures, max width is container 1/3 width
            else if (mediaList.length > 2) {
              style.width = `${boundsWidth / 3}px`
              style.height = `${((boundsWidth / 3) * media.height) / media.width}px`
            }
          }

          const proxySize = {
            width: Number.parseInt(style.width || "0") * 2 || 0,
            height: Number.parseInt(style.height || "0") * 2 || 0,
          }
          return (
            <Media
              style={style}
              key={media.url}
              src={media.url}
              type={media.type}
              previewImageUrl={media.preview_image_url}
              blurhash={media.blurhash}
              className="data-[state=loading]:!bg-material-ultra-thick size-28 shrink-0"
              loading="lazy"
              proxy={proxySize}
              onClick={() => {
                previewMedia(
                  mediaList.map((m) => ({
                    url: m.url,
                    type: m.type,
                    blurhash: m.blurhash,
                    fallbackUrl:
                      m.preview_image_url ?? getImageProxyUrl({ url: m.url, ...proxySize }),
                  })),
                  i,
                )
              }}
            />
          )
        })}
      </div>
    )
  }

  // all media has different ratio, use grid layout
  return (
    <div className="mt-4">
      <div
        className={cn(
          "grid gap-2",
          media.length === 2 && "grid-cols-2",
          media.length === 3 && "grid-cols-2",
          media.length === 4 && "grid-cols-2",
          media.length >= 5 && "grid-cols-3",
        )}
      >
        {media.map((m, i) => {
          const proxySize = {
            width: 400,
            height: 400,
          }

          const style = media.length === 3 && i === 2 ? { gridRow: "span 2" } : {}

          return (
            <Media
              style={style}
              key={m.url}
              src={m.url}
              type={m.type}
              previewImageUrl={m.preview_image_url}
              blurhash={m.blurhash}
              className="aspect-square w-full rounded object-cover"
              loading="lazy"
              proxy={proxySize}
              onClick={() => {
                previewMedia(
                  media.map((m) => ({
                    url: m.url,
                    type: m.type,
                    blurhash: m.blurhash,
                    fallbackUrl:
                      m.preview_image_url ?? getImageProxyUrl({ url: m.url, ...proxySize }),
                  })),
                  i,
                )
              }}
            />
          )
        })}
      </div>
    </div>
  )
}

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
            className="hover:text-text flex items-center justify-center text-xs duration-200"
          >
            <i className="i-mingcute-arrow-to-down-line" />
            <span className="ml-2">{t("words.show_more")}</span>
          </button>
        </div>
      )}
    </AutoResizeHeight>
  )
}

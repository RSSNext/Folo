import { TitleMarquee } from "@follow/components/ui/marquee/index.js"
import { views } from "@follow/constants"
import { IN_ELECTRON } from "@follow/shared/constants"
import { useIsEntryStarred } from "@follow/store/collection/hooks"
import { useEntry } from "@follow/store/entry/hooks"
import { useEntryStore } from "@follow/store/entry/store"
import { useFeedById } from "@follow/store/feed/hooks"
import { cn, formatDuration, transformVideoUrl } from "@follow/utils"
import { FeedViewType } from "@follow-app/client-sdk"
import { useHover } from "@use-gesture/react"
import dayjs from "dayjs"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { usePreviewMedia } from "~/components/ui/media/hooks"
import { Media } from "~/components/ui/media/Media"
import { SwipeMedia } from "~/components/ui/media/SwipeMedia"
import { useEntryIsRead } from "~/hooks/biz/useAsRead"
import { useRouteParamsSelector } from "~/hooks/biz/useRouteParams"
import { EntryContent } from "~/modules/entry-content/components/entry-content"
import type { FeedIconEntry } from "~/modules/feed/feed-icon"
import { FeedIcon } from "~/modules/feed/feed-icon"
import { FeedTitle } from "~/modules/feed/feed-title"

import { StarIcon } from "../star-icon"
import { EntryTranslation } from "../translation"
import type { UniversalItemProps } from "../types"

const cardStylePresets = [
  {
    card: "bg-[#7C6E63] text-white",
    icon: "text-[#B7ADA4]",
  },
  {
    card: "bg-[#D7FED3] text-black",
    icon: "text-[#92E58A]",
  },
  {
    card: "bg-[#FDFFDA] text-black",
    icon: "text-[#F9EFAA]",
  },
  {
    card: "bg-[#FFE5EE] text-black",
    icon: "text-[#FDD1E2]",
  },
  {
    card: "bg-[#CFF0FF] text-black",
    icon: "text-[#A7D6F2]",
  },
  {
    card: "bg-[#ECE7FB] text-black",
    icon: "text-[#DFCFF0]",
  },
]

const ViewTag = IN_ELECTRON ? "webview" : "iframe"

export function AllItem({ entryId, entryPreview, translation }: UniversalItemProps) {
  const view = useViewTypeByEntryId(entryId)
  const entry = useEntry(entryId, (state) => {
    /// keep-sorted
    const { attachments, feedId, id, read, url } = state
    const { authorAvatar, publishedAt, title } = state

    const media = state.media || []
    const photo = media.find((a) => a.type === "photo")
    const firstPhotoUrl = photo?.url
    const iconEntry: FeedIconEntry = {
      firstPhotoUrl,
      authorAvatar,
    }

    const { duration_in_seconds } =
      attachments?.find((attachment) => attachment.duration_in_seconds) ?? {}
    const seconds = duration_in_seconds
      ? Number.parseInt(duration_in_seconds.toString())
      : undefined
    const duration = formatDuration(seconds)
    const firstMedia = media[0]

    return {
      attachments,
      duration,
      feedId,
      firstMedia,
      iconEntry,
      id,
      media,
      publishedAt,
      read,
      title,
      url,
    }
  })

  const isInCollection = useIsEntryStarred(entryId)

  const feeds = useFeedById(entry?.feedId)

  const asRead = useEntryIsRead(entry)

  const { t } = useTranslation("common")

  const icon = useMemo(() => views.find((v) => v.view === view)?.icon, [view])

  const entryMedia = useMemo(
    () => entry?.media || entryPreview?.entries?.media || [],
    [entry, entryPreview],
  )

  const cardStyle = useMemo(() => {
    // Use a hash of entryId to get a consistent index for cardStylePresets
    // djb2 hash
    let hash = 5381
    for (let i = 0, len = entryId.length; i < len; ++i) {
      hash = (hash << 5) + hash + entryId.codePointAt(i)!
    }

    const index = (hash >>> 0) % cardStylePresets.length

    return cardStylePresets[index]!
  }, [entryId])

  const isActive = useRouteParamsSelector(({ entryId }) => entryId === entry?.id)

  const entryContent = useMemo(() => <EntryContent entryId={entryId} noMedia compact />, [entryId])
  const previewMedia = usePreviewMedia(entryContent)

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
    <div>
      {/* Hero */}
      <div
        className={cn(
          "relative flex max-h-[25em] flex-col overflow-hidden rounded-lg",
          cardStyle.card,
          view === FeedViewType.Articles && "min-h-[15em] justify-end",
          view === FeedViewType.Notifications && "min-h-[15em] justify-end",
          view === FeedViewType.SocialMedia && "min-h-[20em] justify-center",
        )}
      >
        {/* Icon */}
        {!entryMedia?.[0] && (
          <div
            className={cn(
              "absolute left-4 top-4 z-[1] flex items-center justify-center text-2xl",
              cardStyle.icon,
            )}
          >
            {icon}
          </div>
        )}

        {/* Article, Notification */}
        {(view === FeedViewType.Articles || view === FeedViewType.Notifications) && (
          <>
            {entryMedia?.[0] ? (
              <Media
                src={entryMedia[0].url}
                type={entryMedia[0].type}
                previewImageUrl={entryMedia[0].preview_image_url}
                className="min-h-[15em] w-full overflow-hidden"
                mediaContainerClassName="w-auto min-h-[15em] h-auto object-cover"
                videoClassName="min-h-[15em]"
                loading="lazy"
                proxy={{
                  width: entryMedia[0].width ?? 160,
                  height: entryMedia[0].height ?? 160,
                }}
                height={entryMedia[0].height}
                width={entryMedia[0].width}
                blurhash={entryMedia[0].blurhash}
              />
            ) : (
              <div className="mt-10 overflow-hidden p-4 text-[1.75rem] font-normal leading-[1.2]">
                <div className="line-clamp-4">{entry.title}</div>
              </div>
            )}
          </>
        )}

        {/* Social Media */}
        {view === FeedViewType.SocialMedia && (
          <>
            {entryMedia?.[0] ? (
              <Media
                src={entryMedia[0].url}
                type={entryMedia[0].type}
                previewImageUrl={entryMedia[0].preview_image_url}
                className="min-h-[20em] w-full overflow-hidden"
                mediaContainerClassName="w-auto min-h-[20em] h-auto object-cover"
                videoClassName="min-h-[20em]"
                loading="lazy"
                proxy={{
                  width: entryMedia[0].width ?? 160,
                  height: entryMedia[0].height ?? 160,
                }}
                height={entryMedia[0].height}
                width={entryMedia[0].width}
                blurhash={entryMedia[0].blurhash}
              />
            ) : (
              <div className="flex flex-col items-center justify-center overflow-hidden p-4 text-[1.25rem] font-normal leading-[1.2]">
                <div className="line-clamp-6">{entry.title}</div>
              </div>
            )}
          </>
        )}

        {/* Pictures */}
        {view === FeedViewType.Pictures && (
          <div className="relative flex gap-2 overflow-x-auto">
            {entryMedia ? (
              <SwipeMedia
                media={entryMedia}
                className={cn(
                  "aspect-square",
                  "w-full shrink-0 rounded-md [&_img]:rounded-md",
                  isActive && "rounded-b-none",
                )}
                imgClassName="object-cover"
                onPreview={previewMedia}
              />
            ) : (
              <div className="center bg-material-medium text-text-secondary aspect-square w-full flex-col gap-1 rounded-md text-xs">
                <i className="i-mgc-sad-cute-re size-6" />
                {t("entry_content.no_content")}
              </div>
            )}
          </div>
        )}

        {/* Videos */}
        {view === FeedViewType.Videos && (
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
        )}

        {/* Audios */}
        {view === FeedViewType.Audios && (
          <div className="relative flex gap-2 overflow-x-auto">
            {entryMedia?.[0] ? (
              <Media
                src={entryMedia[0].url}
                type={entryMedia[0].type}
                previewImageUrl={entryMedia[0].preview_image_url}
                className="min-h-[15em] w-full overflow-hidden"
                mediaContainerClassName="w-auto min-h-[15em] h-auto object-cover"
                loading="lazy"
                proxy={{
                  width: entryMedia[0].width ?? 160,
                  height: entryMedia[0].height ?? 160,
                }}
                height={entryMedia[0].height}
                width={entryMedia[0].width}
              />
            ) : (
              <div className="center bg-material-medium text-text-secondary aspect-square w-full flex-col gap-1 rounded-md text-xs">
                <i className="i-mgc-sad-cute-re size-6" />
                {t("entry_content.no_content")}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className={cn("relative px-4 pb-4 text-sm")}>
        <div className="flex items-center">
          <div
            className={cn(
              "bg-accent mr-1 size-1.5 shrink-0 self-center rounded-full duration-200",
              asRead && "mr-0 w-0",
            )}
          />
          <div
            className={cn(
              "relative mb-1 mt-1.5 flex w-full items-center gap-1 truncate font-medium",
            )}
          >
            <TitleMarquee className="min-w-0 grow">
              <EntryTranslation source={entry.title} target={translation?.title} />
            </TitleMarquee>
            {isInCollection && (
              <div className="h-0 shrink-0 -translate-y-2">
                <StarIcon />
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between truncate text-[13px]">
          <div className="flex items-center gap-1">
            <FeedIcon
              fallback
              noMargin
              className="flex"
              feed={feeds!}
              entry={entry.iconEntry}
              size={18}
            />
            <span className={cn("min-w-0 truncate pl-1")}>
              <FeedTitle feed={feeds} />
            </span>
          </div>

          <div>
            <span className={cn("text-zinc-500")}>
              {dayjs
                .duration(dayjs(entry.publishedAt).diff(dayjs(), "minute"), "minute")
                .humanize()}
              {t("space")}
              {t("words.ago")}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// function AllArticleItem({ entryId, entryPreview, translation }: UniversalItemProps) {
//   return <ListItem entryId={entryId} entryPreview={entryPreview} translation={translation} />
// }

// Determine the most appropriate view type for an entry
function useViewTypeByEntryId(entryId: string): FeedViewType {
  return useEntryStore(
    useCallback(
      (state) => {
        const certain = Object.entries(state.entryIdByView).find(([_, entryIds]) =>
          entryIds.has(entryId),
        )?.[0] as FeedViewType | undefined
        const fallback = FeedViewType.Articles
        return Number(certain ?? fallback)
      },
      [entryId],
    ),
  )
}

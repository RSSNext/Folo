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
import { useCallback, useMemo, useRef, useState } from "react"
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
import type { EntryListItemFC } from "../types"

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

const highlightStyle = [
  {
    type: "underline",
    className: "underline decoration-blue-500 decoration-4 underline-offset-1",
  },
  {
    type: "underline",
    className: "underline decoration-yellow-500 decoration-4 underline-offset-1",
  },
  {
    type: "underline",
    className: "underline decoration-green-500 decoration-4 underline-offset-1",
  },
  {
    type: "underline",
    className: "underline decoration-orange-500 decoration-4 underline-offset-1",
  },
  // {
  //   type: "underline-wavy",
  //   className:
  //     "underline decoration-blue-500 decoration-4 underline-offset-1 decoration-wavy",
  // },
  // {
  //   type: "underline-wavy",
  //   className:
  //     "underline decoration-yellow-500 decoration-4 underline-offset-1 decoration-wavy",
  // },
  // {
  //   type: "underline-wavy",
  //   className:
  //     "underline decoration-green-500 decoration-4 underline-offset-1 decoration-wavy",
  // },
  // {
  //   type: "underline-wavy",
  //   className:
  //     "underline decoration-orange-500 decoration-4 underline-offset-1 decoration-wavy",
  // },
  {
    type: "full",
    className: "bg-blue-200 text-black",
  },
  {
    type: "full",
    className: "bg-yellow-200 text-black",
  },
  {
    type: "full",
    className: "bg-green-200 text-black",
  },
  {
    type: "full",
    className: "bg-orange-200 text-black",
  },
]

const ViewTag = IN_ELECTRON ? "webview" : "iframe"

export const AllItem: EntryListItemFC = ({ entryId, entryPreview, translation }) => {
  const view = useViewTypeByEntryId(entryId)
  const entry = useEntry(entryId, (state) => {
    /// keep-sorted
    const {
      attachments,
      authorAvatar,
      content,
      description,
      extra,
      feedId,
      id,
      publishedAt,
      read,
      title,
      url,
    } = state

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

    return {
      attachments,
      duration,
      content,
      extra,
      feedId,
      iconEntry,
      id,
      media,
      publishedAt,
      read,
      title,
      description,
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

  const randomStyle = useMemo(() => {
    // Use a hash of entryId to get a consistent index for card style
    // djb2 hash
    let hash = 5381
    for (let i = 0, len = entryId.length; i < len; ++i) {
      hash = (hash << 5) + hash + entryId.codePointAt(i)!
    }

    const hashShift = (hash >>> 0) + 1

    const cardIndex = hashShift % cardStylePresets.length
    const highlightIndex = hashShift % highlightStyle.length

    return {
      card: cardStylePresets[cardIndex]!,
      highlight: highlightStyle[highlightIndex]!,
    }
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
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  useHover(
    (event) => {
      const hovered = event.active
      if (hovered) {
        if (hoverTimerRef.current) {
          clearTimeout(hoverTimerRef.current)
        }
        hoverTimerRef.current = setTimeout(() => {
          setShowPreview(true)
        }, 500)
      } else {
        setShowPreview(false)
        if (hoverTimerRef.current) {
          clearTimeout(hoverTimerRef.current)
          hoverTimerRef.current = null
        }
      }
    },
    { target: ref },
  )

  const title = entry?.title || entry?.description || entry?.content
  const titleKeyword = entry?.extra?.title_keyword?.toLowerCase().trim() || ""

  const titleWithKeyword = useMemo(() => {
    if (!title || !titleKeyword) return title

    const renderTitle = ({ type }: { type: "highlight" | "normal" }) => (
      <>
        {title
          .split(new RegExp(`(${titleKeyword.replaceAll(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"))
          .map((part, index) => {
            // Check if this part matches the keyword (case-insensitive)
            const normalizedPart = part.toLowerCase().trim()
            const normalizedKeyword = titleKeyword.trim()
            const isKeyword = normalizedPart === normalizedKeyword && part.trim() !== ""

            return isKeyword ? (
              <span
                key={`keyword-${index}-${part}`}
                className={cn(type === "highlight" && randomStyle.highlight.className)}
                style={{
                  textDecorationSkipInk: "none",
                }}
              >
                {part}
              </span>
            ) : (
              <span
                key={`text-${index}-${part}`}
                className={cn(type === "highlight" && "text-transparent")}
              >
                {part}
              </span>
            )
          })}
      </>
    )

    return (
      <div className="relative">
        {renderTitle({ type: "normal" })}
        <div className="absolute inset-0 z-0">{renderTitle({ type: "highlight" })}</div>
      </div>
    )
  }, [randomStyle.highlight.className, titleKeyword, title])

  if (!entry) return null

  const mediaCover = entryMedia?.[0] ?? null

  const mediaCoverHeight = mediaCover?.height
  const mediaCoverWidth = mediaCover?.width

  const aspectRatio =
    mediaCoverHeight && mediaCoverWidth ? mediaCoverWidth / mediaCoverHeight : undefined

  return (
    <div className="group" ref={ref}>
      {/* Hero */}
      <div
        className={cn(
          "relative flex max-h-[35em] flex-col overflow-hidden rounded-lg",
          "before:group-hover:bg-theme-item-hover before:absolute before:inset-0 before:z-10 before:transition-colors before:duration-200",
          randomStyle.card.card,
        )}
      >
        {/* Icon */}
        {!mediaCover && (
          <div
            className={cn(
              "absolute left-4 top-4 z-[1] flex items-center justify-center text-2xl",
              randomStyle.card.icon,
            )}
          >
            {icon}
          </div>
        )}

        {/* Common views */}
        {(view === FeedViewType.Articles ||
          view === FeedViewType.Notifications ||
          view === FeedViewType.SocialMedia ||
          view === FeedViewType.Audios) && (
          <>
            {mediaCover ? (
              <Media
                src={mediaCover.url}
                type={mediaCover.type}
                previewImageUrl={mediaCover.preview_image_url}
                className="min-h-[10em] w-full overflow-hidden"
                mediaContainerClassName="size-full min-h-[10em] object-cover"
                videoClassName="size-full min-h-[10em] object-cover"
                loading="lazy"
                proxy={{
                  width: mediaCoverWidth ?? 200,
                  height: mediaCoverHeight ?? 200,
                }}
                blurhash={mediaCover.blurhash || undefined}
                style={{
                  aspectRatio: aspectRatio ?? 1,
                }}
              />
            ) : (
              <div className="flex min-h-[10em] flex-col items-center justify-center overflow-hidden px-4 py-20 text-[1.5rem] font-normal leading-[1.2]">
                <div className="line-clamp-6 max-w-full break-words">{titleWithKeyword}</div>
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
              <div className="flex min-h-[10em] flex-col items-center justify-center overflow-hidden px-4 py-20 text-[1.5rem] font-normal leading-[1.2]">
                <div className="line-clamp-6 max-w-full break-words">{titleWithKeyword}</div>
              </div>
            )}
          </div>
        )}

        {/* Videos */}
        {view === FeedViewType.Videos && (
          <div className="cursor-card w-full">
            <div className="relative overflow-x-auto">
              {mediaCover ? (
                <Media
                  key={mediaCover.url}
                  src={mediaCover.url}
                  type={mediaCover.type}
                  previewImageUrl={mediaCover.preview_image_url}
                  className="min-h-[10em] w-full overflow-hidden"
                  mediaContainerClassName="size-full min-h-[10em] object-cover"
                  videoClassName="size-full min-h-[10em] object-cover"
                  loading="lazy"
                  proxy={{
                    width: mediaCover.width ?? 640,
                    height: mediaCover.height ?? 360,
                  }}
                  blurhash={mediaCover.blurhash || undefined}
                  style={{
                    aspectRatio: aspectRatio ?? 16 / 9,
                  }}
                  showFallback={true}
                />
              ) : (
                <div className="flex min-h-[10em] flex-col items-center justify-center overflow-hidden px-4 py-20 text-[1.5rem] font-normal leading-[1.2]">
                  <div className="line-clamp-6 max-w-full break-words">{titleWithKeyword}</div>
                </div>
              )}
              {miniIframeSrc && showPreview && (
                <div className="pointer-events-none absolute inset-0">
                  <ViewTag
                    src={miniIframeSrc}
                    className={cn("pointer-events-none size-full min-h-[10em] object-cover")}
                  />
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
      </div>

      {/* Footer */}
      <div className={cn("relative px-1 pb-4 text-sm")}>
        <div className="flex items-center">
          <div
            className={cn(
              "bg-accent mr-1 size-1.5 shrink-0 self-center rounded-full duration-200",
              asRead && "mr-0 w-0",
            )}
          />
          <div className={cn("relative mb-1 mt-1.5 flex w-full items-center gap-1 font-medium")}>
            <EntryTranslation
              source={entry.title}
              target={translation?.title}
              className="line-clamp-2"
              inline={false}
            />

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
            <span className={cn("text-text-secondary min-w-0 truncate pl-1")}>
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

AllItem.wrapperClassName = "hover:bg-transparent"

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

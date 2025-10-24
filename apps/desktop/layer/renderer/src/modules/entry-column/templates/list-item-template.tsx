import { useMobile } from "@follow/components/hooks/useMobile.js"
import { EllipsisHorizontalTextWithTooltip } from "@follow/components/ui/typography/index.js"
import { useCollectionEntry, useIsEntryStarred } from "@follow/store/collection/hooks"
import { useEntry } from "@follow/store/entry/hooks"
import type { EntryModel } from "@follow/store/entry/types"
import { useFeedById } from "@follow/store/feed/hooks"
import { useInboxById } from "@follow/store/inbox/hooks"
import { clsx, cn, formatEstimatedMins, formatTimeToSeconds, isSafari } from "@follow/utils/utils"
import { useMemo } from "react"
import { titleCase } from "title-case"

import { AudioPlayer, useAudioPlayerAtomSelector } from "~/atoms/player"
import { useGeneralSettingKey } from "~/atoms/settings/general"
import { useUISettingKey } from "~/atoms/settings/ui"
import { RelativeTime } from "~/components/ui/datetime"
import { Media } from "~/components/ui/media/Media"
import { FEED_COLLECTION_LIST } from "~/constants"
import { useEntryIsRead } from "~/hooks/biz/useAsRead"
import { useRouteParamsSelector } from "~/hooks/biz/useRouteParams"
import { EntryTranslation } from "~/modules/entry-column/translation"
import type { FeedIconEntry } from "~/modules/feed/feed-icon"
import { FeedIcon } from "~/modules/feed/feed-icon"
import { FeedTitle } from "~/modules/feed/feed-title"
import { getPreferredTitle } from "~/store/feed/hooks"

import { StarIcon } from "../star-icon"
import type { UniversalItemProps } from "../types"

const entrySelector = (state: EntryModel) => {
  /// keep-sorted
  const { authorAvatar, authorUrl, description, feedId, inboxHandle, publishedAt, title } = state

  const audios = state.attachments?.filter((a) => a.mime_type?.startsWith("audio") && a.url)
  const firstAudio = audios?.[0]
  const media = state.media || []
  const firstMedia = media?.[0]
  const photo = media.find((a) => a.type === "photo")
  const firstPhotoUrl = photo?.url

  /// keep-sorted
  return {
    authorAvatar,
    authorUrl,
    description,
    feedId,
    firstAudio,
    firstMedia,
    firstPhotoUrl,
    inboxId: inboxHandle,
    publishedAt,
    title,
  }
}

export function ListItem({
  entryId,
  translation,
  simple,
}: UniversalItemProps & {
  simple?: boolean
}) {
  const isMobile = useMobile()
  const entry = useEntry(entryId, entrySelector)

  const isInCollection = useIsEntryStarred(entryId)
  const collectionCreatedAt = useCollectionEntry(entryId)?.createdAt

  const isRead = useEntryIsRead(entryId)

  const inInCollection = useRouteParamsSelector((s) => s.feedId === FEED_COLLECTION_LIST)

  const feed = useFeedById(entry?.feedId, (feed) => {
    return {
      type: feed.type,
      ownerUserId: feed.ownerUserId,
      id: feed.id,
      title: feed.title,
      url: (feed as any).url || "",
      image: feed.image,
      siteUrl: feed.siteUrl,
    }
  })

  const inbox = useInboxById(entry?.inboxId)

  const thumbnailRatio = useUISettingKey("thumbnailRatio")
  const rid = `list-item-${entryId}`

  const bilingual = useGeneralSettingKey("translationMode") === "bilingual"

  const iconEntry: FeedIconEntry = useMemo(
    () => ({
      firstPhotoUrl: entry?.firstPhotoUrl,
      authorAvatar: entry?.authorAvatar,
    }),
    [entry?.firstPhotoUrl, entry?.authorAvatar],
  )

  const titleEntry = useMemo(
    () => ({
      authorUrl: entry?.authorUrl,
    }),
    [entry?.authorUrl],
  )

  const lineClamp = useMemo(() => {
    const envIsSafari = isSafari()
    let lineClampTitle = 1
    let lineClampDescription = 2

    if (translation?.title && translation?.title !== entry?.title && !simple && bilingual) {
      lineClampTitle += 1
    }
    if (
      translation?.description &&
      translation?.description !== entry?.description &&
      !simple &&
      bilingual
    ) {
      lineClampDescription += 1
    }

    // FIXME: Safari bug, not support line-clamp cross elements
    return {
      global: !envIsSafari
        ? `line-clamp-[${simple ? lineClampTitle : lineClampTitle + lineClampDescription}]`
        : "",
      title: envIsSafari ? `line-clamp-[${lineClampTitle}]` : "",
      description: envIsSafari ? `line-clamp-[${lineClampDescription}]` : "",
    }
  }, [
    simple,
    translation?.description,
    translation?.title,
    entry?.description,
    entry?.title,
    bilingual,
  ])

  const dimRead = useGeneralSettingKey("dimRead")
  // NOTE: prevent 0 height element, react virtuoso will not stop render any more
  if (!entry || !(feed || inbox)) return null

  const displayTime = inInCollection ? collectionCreatedAt : entry?.publishedAt

  const related = feed || inbox

  const hasAudio = simple ? false : !!entry.firstAudio?.url
  const hasMedia = simple ? false : !!entry.firstMedia?.url

  const marginWidth = 8 * (isMobile ? 1.125 : 1)
  // calculate the max width to have a correct truncation
  // FIXME: this is not easy to maintain, need to refactor
  const feedIconWidth = 20 + marginWidth
  const audioCoverWidth = 80 + marginWidth
  const mediaWidth = 80 * (isMobile ? 1.125 : 1) + marginWidth

  let savedWidth = 0

  savedWidth += feedIconWidth

  if (hasAudio) {
    savedWidth += audioCoverWidth
  }
  if (hasMedia && !hasAudio) {
    savedWidth += mediaWidth
  }

  return (
    <div
      className={cn(
        "group relative flex cursor-menu py-3",
        !isRead &&
          "before:absolute before:-left-3 before:top-5 before:block before:size-2 before:rounded-full before:bg-accent",
      )}
    >
      <FeedIcon target={related} fallback entry={iconEntry} size={24} />
      <div
        className={cn("-mt-0.5 ml-1 h-fit flex-1 text-sm leading-tight", lineClamp.global)}
        style={{
          maxWidth: `calc(100% - ${savedWidth}px)`,
        }}
      >
        <div
          className={cn(
            "flex gap-1 text-[10px] font-bold",
            "text-text-secondary",
            isInCollection && "text-text-secondary",
            isRead && dimRead && "text-text-tertiary",
          )}
        >
          <EllipsisHorizontalTextWithTooltip className="truncate">
            <FeedTitle
              feed={related}
              title={getPreferredTitle(related, titleEntry)}
              className="space-x-0.5"
            />
          </EllipsisHorizontalTextWithTooltip>
          <span>·</span>
          <span className="shrink-0">{!!displayTime && <RelativeTime date={displayTime} />}</span>
        </div>
        <div
          className={cn(
            "relative my-0.5 break-words",
            "text-text",
            !!isInCollection && "pr-5",
            entry?.title ? "font-medium" : "text-[13px]",
            isRead && dimRead && "text-text-secondary",
          )}
        >
          {entry?.title ? (
            <EntryTranslation
              className={cn("autospace-normal hyphens-auto font-medium", lineClamp.title)}
              source={titleCase(entry?.title ?? "")}
              target={titleCase(translation?.title ?? "")}
            />
          ) : (
            <EntryTranslation
              className={cn("autospace-normal hyphens-auto", lineClamp.description)}
              source={entry?.description}
              target={translation?.description}
            />
          )}
          {!!isInCollection && <StarIcon className="absolute right-0 top-0" />}
        </div>
        {!simple && (
          <div
            className={cn(
              "text-[13px]",
              "text-text-secondary",
              isRead && dimRead && "text-text-tertiary",
            )}
          >
            <EntryTranslation
              className={cn("autospace-normal hyphens-auto", lineClamp.description)}
              source={entry?.description}
              target={translation?.description}
            />
          </div>
        )}
      </div>

      {hasAudio && entry.firstAudio && (
        <AudioCover
          entryId={entryId}
          src={entry.firstAudio.url}
          durationInSeconds={entry.firstAudio.duration_in_seconds}
          feedIcon={
            <FeedIcon
              fallback={true}
              fallbackElement={
                <div className={clsx("bg-material-ultra-thick", "size-[80px]", "rounded")} />
              }
              target={feed || inbox}
              entry={iconEntry}
              size={80}
              className="m-0 rounded"
              useMedia
              noMargin
            />
          }
        />
      )}

      {!simple && !hasAudio && entry.firstMedia && (
        <Media
          thumbnail
          src={entry.firstMedia.url}
          type={entry.firstMedia.type}
          previewImageUrl={entry.firstMedia.preview_image_url}
          className={cn("center ml-2 flex shrink-0 rounded", "size-20")}
          mediaContainerClassName={"w-auto h-auto rounded"}
          loading="lazy"
          key={`${rid}-media-${thumbnailRatio}`}
          proxy={{
            width: 160,
            height: thumbnailRatio === "square" ? 160 : 0,
          }}
          height={entry.firstMedia.height}
          width={entry.firstMedia.width}
          blurhash={entry.firstMedia.blurhash}
        />
      )}
    </div>
  )
}

function AudioCover({
  entryId,
  src,
  durationInSeconds,
  feedIcon,
}: {
  entryId: string
  src: string
  durationInSeconds?: number | string
  feedIcon: React.ReactNode
}) {
  const isMobile = useMobile()
  const playStatus = useAudioPlayerAtomSelector((playerValue) =>
    playerValue.src === src && playerValue.show ? playerValue.status : false,
  )

  const language = useGeneralSettingKey("language")
  const isChinese = useMemo(() => {
    return language === "zh-CN"
  }, [language])

  const seconds = formatTimeToSeconds(durationInSeconds)
  const estimatedMins = seconds && Math.floor(seconds / 60)

  const handleClickPlay = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation()
    e.preventDefault()
    if (!playStatus) {
      // switch this to play
      AudioPlayer.mount({
        type: "audio",
        entryId,
        src,
        currentTime: 0,
      })
    } else {
      // switch between play and pause
      AudioPlayer.togglePlayAndPause()
    }
  }

  return (
    <div className="relative ml-2 shrink-0">
      {feedIcon}

      <div
        className={cn(
          "center absolute inset-0 w-full transition-all duration-200 ease-in-out group-hover:opacity-100",
          playStatus || isMobile ? "opacity-100" : "opacity-0",
        )}
        onClick={handleClickPlay}
      >
        <button
          type="button"
          className="center size-10 rounded-full bg-material-opaque opacity-95 hover:bg-accent hover:text-white hover:opacity-100"
        >
          <i
            className={cn("size-6", {
              "i-mingcute-pause-fill": playStatus && playStatus === "playing",
              "i-mingcute-loading-fill animate-spin": playStatus && playStatus === "loading",
              "i-mingcute-play-fill": !playStatus || playStatus === "paused",
            })}
          />
        </button>
      </div>

      {!!estimatedMins && (
        <div className="absolute bottom-0 w-full overflow-hidden rounded-b-sm text-center">
          <div
            className={cn(
              "absolute left-0 top-0 size-full bg-material-ultra-thick opacity-0 duration-200 group-hover:opacity-100",
              isMobile && "opacity-100",
            )}
          />
          <div
            className={cn(
              "text-body opacity-0 backdrop-blur-none duration-200 group-hover:opacity-100 group-hover:backdrop-blur-background",
              isMobile && "opacity-100 backdrop-blur-background",
            )}
          >
            {isChinese ? `${estimatedMins} 分钟` : formatEstimatedMins(estimatedMins)}
          </div>
        </div>
      )}
    </div>
  )
}

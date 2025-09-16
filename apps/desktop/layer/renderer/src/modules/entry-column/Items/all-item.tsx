import { Skeleton } from "@follow/components/ui/skeleton/index.jsx"
import {
  Tooltip,
  TooltipContent,
  TooltipPortal,
  TooltipRoot,
  TooltipTrigger,
} from "@follow/components/ui/tooltip/index.js"
import { EllipsisHorizontalTextWithTooltip } from "@follow/components/ui/typography/index.js"
import { IN_ELECTRON } from "@follow/shared/constants"
import { useCollectionEntry, useIsEntryStarred } from "@follow/store/collection/hooks"
import { useEntry } from "@follow/store/entry/hooks"
import type { EntryModel } from "@follow/store/entry/types"
import { useFeedById } from "@follow/store/feed/hooks"
import { useInboxById } from "@follow/store/inbox/hooks"
import { transformVideoUrl } from "@follow/utils/url-for-video"
import { cn, isSafari } from "@follow/utils/utils"
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
import { readableContentMaxWidth } from "../styles"
import type { EntryItemStatelessProps, UniversalItemProps } from "../types"
import { MediaGallery } from "./media-gallery"

const ViewTag = IN_ELECTRON ? "webview" : "iframe"

const entrySelector = (state: EntryModel) => {
  const { feedId, inboxHandle, read } = state
  const { authorAvatar, authorUrl, description, publishedAt, title } = state

  const audios = state.attachments?.filter((a) => a.mime_type?.startsWith("audio") && a.url)
  const video = transformVideoUrl({
    url: state?.url ?? "",
    isIframe: !IN_ELECTRON,
    attachments: state?.attachments,
    mini: true,
  })
  const firstAudio = audios?.[0]
  const media = state.media || []
  const firstMedia = media?.[0]
  const photo = media.find((a) => a.type === "photo")
  const firstPhotoUrl = photo?.url
  const iconEntry: FeedIconEntry = { firstPhotoUrl, authorAvatar }

  const titleEntry = { authorUrl }

  return {
    description,
    feedId,
    firstAudio,
    firstMedia,
    iconEntry,
    inboxId: inboxHandle,
    publishedAt,
    read,
    title,
    titleEntry,
    video,
  }
}
export function AllItem({ entryId, translation, currentFeedTitle }: UniversalItemProps) {
  const entry = useEntry(entryId, entrySelector)
  const simple = true

  const isInCollection = useIsEntryStarred(entryId)
  const collectionCreatedAt = useCollectionEntry(entryId)?.createdAt

  const isRead = useEntryIsRead(entry)

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
  const lineClamp = useMemo(() => {
    const envIsSafari = isSafari()
    let lineClampTitle = 1
    let lineClampDescription = 2

    if (translation?.title && !simple && bilingual) {
      lineClampTitle += 1
    }
    if (translation?.description && !simple && bilingual) {
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
  }, [simple, translation?.description, translation?.title, bilingual])

  const dimRead = useGeneralSettingKey("dimRead")
  // NOTE: prevent 0 height element, react virtuoso will not stop render any more
  if (!entry || !(feed || inbox)) return null

  const displayTime = inInCollection ? collectionCreatedAt : entry?.publishedAt

  const related = feed || inbox

  const thisFeedTitle = getPreferredTitle(related, entry?.titleEntry)
  return (
    <div
      className={cn(
        "cursor-menu group relative flex items-start py-2",
        !isRead &&
          "before:bg-accent before:absolute before:-left-4 before:top-[14px] before:block before:size-2 before:rounded-full",
      )}
    >
      {currentFeedTitle !== thisFeedTitle && (
        <div className="flex min-w-0 shrink-0 items-center gap-1">
          <FeedIcon target={related} fallback entry={entry?.iconEntry} size={20} />
          <div
            className={cn(
              "mr-4 flex w-20 shrink-0 gap-1 text-xs",
              "text-text-secondary",
              isInCollection && "text-text-secondary",
              isRead && dimRead && "text-text-tertiary",
            )}
          >
            <EllipsisHorizontalTextWithTooltip className="truncate">
              <FeedTitle
                feed={related}
                title={getPreferredTitle(related, entry?.titleEntry)}
                className="space-x-0.5"
              />
            </EllipsisHorizontalTextWithTooltip>
          </div>
        </div>
      )}
      <div className={cn("flex h-fit min-w-0 flex-1 flex-row items-start text-sm leading-tight")}>
        {entry.firstMedia && (
          <Tooltip>
            <TooltipRoot>
              <TooltipTrigger asChild>
                <Media
                  thumbnail
                  src={entry.firstMedia.url}
                  type={entry.firstMedia.type}
                  previewImageUrl={entry.firstMedia.preview_image_url}
                  className={cn("center mr-2 flex shrink-0 rounded", "size-5")}
                  mediaContainerClassName={"w-auto h-auto rounded-sm"}
                  loading="lazy"
                  key={`${rid}-media-${thumbnailRatio}`}
                  proxy={{
                    width: 40,
                    height: 40,
                  }}
                  height={entry.firstMedia.height}
                  width={entry.firstMedia.width}
                  blurhash={entry.firstMedia.blurhash}
                />
              </TooltipTrigger>
              <TooltipPortal>
                <TooltipContent className="flex-col gap-1" side={"bottom"}>
                  <div className="flex items-center gap-1">
                    <MediaGallery entryId={entryId} containerWidth={575} />
                  </div>
                </TooltipContent>
              </TooltipPortal>
            </TooltipRoot>
          </Tooltip>
        )}
        {entry.firstAudio && <AudioIcon entryId={entryId} src={entry.firstAudio.url} />}
        {entry.video && <VideoIcon src={entry.video} />}
        <div
          className={cn(
            "relative flex min-w-0 items-center truncate break-words",
            "text-text",
            !!isInCollection && "pr-5",
            entry?.title ? "font-medium" : "text-[13px]",
            isRead && dimRead && "text-text-secondary",
          )}
        >
          <EllipsisHorizontalTextWithTooltip>
            {entry?.title ? (
              <EntryTranslation
                inline={false}
                className={cn(
                  "flex min-w-0 flex-col justify-center hyphens-auto font-medium",
                  lineClamp.title,
                )}
                source={titleCase(entry?.title ?? "")}
                target={titleCase(translation?.title ?? "")}
              />
            ) : (
              <EntryTranslation
                inline={false}
                className={cn("inline-flex items-center hyphens-auto", lineClamp.description)}
                source={entry?.description}
                target={translation?.description}
              />
            )}
          </EllipsisHorizontalTextWithTooltip>
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
              className={cn("hyphens-auto", lineClamp.description)}
              source={entry?.description}
              target={translation?.description}
            />
          </div>
        )}
      </div>

      <div className="text-text-secondary ml-4 shrink-0 text-xs">
        {!!displayTime && <RelativeTime date={displayTime} />}
      </div>
    </div>
  )
}

AllItem.wrapperClassName = "pl-7 pr-5"

export function AllItemStateLess({ entry, feed }: EntryItemStatelessProps) {
  return (
    <div className="cursor-menu group relative flex py-4">
      <FeedIcon target={feed} fallback className="mr-2 size-5" />
      <div className="-mt-0.5 min-w-0 flex-1 text-sm leading-tight">
        <div className="text-text-secondary flex gap-1 text-[10px] font-bold">
          <FeedTitle feed={feed} />
          <span>·</span>
          <span>{!!entry.publishedAt && <RelativeTime date={entry.publishedAt} />}</span>
        </div>
        <div className="text-text relative my-0.5 truncate break-words font-medium">
          {entry.title}
        </div>
      </div>
    </div>
  )
}

export const AllItemSkeleton = (
  <div className={`relative w-full select-none ${readableContentMaxWidth}`}>
    <div className="group relative flex py-4">
      <Skeleton className="mr-2 size-5 shrink-0 overflow-hidden rounded-sm" />
      <div className="-mt-0.5 line-clamp-4 flex-1 text-sm leading-tight">
        <div className="text-material-opaque flex gap-1 text-[10px] font-bold">
          <Skeleton className="h-3 w-32 truncate" />
          <span>·</span>
          <Skeleton className="h-3 w-12 shrink-0" />
        </div>
        <div className="relative my-0.5 break-words">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-3/4" />
        </div>
      </div>
    </div>
  </div>
)

function AudioIcon({ entryId, src }: { entryId: string; src: string }) {
  const playStatus = useAudioPlayerAtomSelector((playerValue) =>
    playerValue.src === src && playerValue.show ? playerValue.status : false,
  )

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
    <div className="relative mr-1 shrink-0 text-base">
      <div
        className={cn("center w-full transition-all duration-200 ease-in-out")}
        onClick={handleClickPlay}
      >
        <button type="button" className="center text-text/90">
          <i
            className={cn({
              "i-mingcute-pause-fill": playStatus && playStatus === "playing",
              "i-mingcute-loading-fill animate-spin": playStatus && playStatus === "loading",
              "i-mgc-music-2-cute-fi": !playStatus || playStatus === "paused",
            })}
          />
        </button>
      </div>
    </div>
  )
}

function VideoIcon({ src }: { src: string }) {
  return (
    <Tooltip>
      <TooltipRoot>
        <TooltipTrigger asChild>
          <i className="i-mgc-video-cute-fi text-text/90 mr-1 shrink-0 text-lg" />
        </TooltipTrigger>
        <TooltipPortal>
          <TooltipContent className="flex-col gap-1" side={"bottom"}>
            <div className="flex items-center gap-1">
              <ViewTag
                src={src}
                className={cn(
                  "pointer-events-none aspect-video w-[575px] shrink-0 rounded-md bg-black object-cover",
                )}
              />
            </div>
          </TooltipContent>
        </TooltipPortal>
      </TooltipRoot>
    </Tooltip>
  )
}

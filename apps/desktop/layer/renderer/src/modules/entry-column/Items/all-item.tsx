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
import { RelativeTime } from "~/components/ui/datetime"
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

const ViewTag = IN_ELECTRON ? "webview" : "iframe"

const entrySelector = (state: EntryModel) => {
  /// keep-sorted
  const { authorAvatar, authorUrl, description, feedId, inboxHandle, publishedAt, title } = state

  const audios = state.attachments?.filter((a) => a.mime_type?.startsWith("audio") && a.url)
  const video = transformVideoUrl({
    url: state?.url ?? "",
    isIframe: !IN_ELECTRON,
    attachments: state?.attachments,
    mini: true,
  })
  const firstAudio = audios?.[0]
  const media = state.media || []
  const photo = media.find((a) => a.type === "photo")
  const firstPhotoUrl = photo?.url

  /// keep-sorted
  return {
    authorAvatar,
    authorUrl,
    description,
    feedId,
    firstAudio,
    firstPhotoUrl,
    inboxId: inboxHandle,
    publishedAt,
    title,
    video,
  }
}

export function AllItem({ entryId, translation, currentFeedTitle }: UniversalItemProps) {
  const entry = useEntry(entryId, entrySelector)
  const simple = true

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

  const thisFeedTitle = getPreferredTitle(related, titleEntry)
  return (
    <div
      className={cn(
        "group relative flex cursor-menu items-center py-2",
        !isRead &&
          "before:absolute before:-left-4 before:top-[14px] before:block before:size-2 before:rounded-full before:bg-accent",
      )}
    >
      {currentFeedTitle !== thisFeedTitle && (
        <FeedIcon target={related} fallback entry={iconEntry} size={16} />
      )}
      <div className={cn("flex h-fit min-w-0 flex-1 items-center truncate text-sm leading-tight")}>
        {entry.firstAudio && <AudioIcon entryId={entryId} src={entry.firstAudio.url} />}
        {entry.video && <VideoIcon src={entry.video} />}
        <div
          className={cn(
            "relative flex items-center",
            "text-text",
            !!isInCollection && "pr-5",
            entry?.title ? "font-medium" : "text-[13px]",
            isRead && dimRead && "text-text-secondary",
          )}
        >
          <EllipsisHorizontalTextWithTooltip>
            {entry?.title ? (
              <EntryTranslation
                className={cn(
                  "inline-flex min-w-0 items-center hyphens-auto font-medium",
                  lineClamp.title,
                )}
                source={titleCase(entry?.title ?? "")}
                target={titleCase(translation?.title ?? "")}
              />
            ) : (
              <EntryTranslation
                className={cn("inline-flex items-center hyphens-auto", lineClamp.description)}
                source={entry?.description}
                target={translation?.description}
              />
            )}
          </EllipsisHorizontalTextWithTooltip>
          {!!isInCollection && <StarIcon className="absolute right-0 top-0" />}
        </div>
        <div
          className={cn(
            "ml-2 truncate text-[13px]",
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
      </div>

      <div className="ml-4 shrink-0 text-xs text-text-secondary">
        {!!displayTime && <RelativeTime date={displayTime} postfix="" />}
      </div>
    </div>
  )
}

AllItem.wrapperClassName = "pl-5 pr-4 @[700px]:pl-6 @[1024px]:pr-5"

export function AllItemStateLess({ entry, feed }: EntryItemStatelessProps) {
  return (
    <div className="group relative flex cursor-menu py-4">
      <FeedIcon target={feed} fallback className="mr-2 size-5" />
      <div className="-mt-0.5 min-w-0 flex-1 text-sm leading-tight">
        <div className="flex gap-1 text-[10px] font-bold text-text-secondary">
          <FeedTitle feed={feed} />
          <span>·</span>
          <span>{!!entry.publishedAt && <RelativeTime date={entry.publishedAt} />}</span>
        </div>
        <div className="relative my-0.5 truncate break-words font-medium text-text">
          {entry.title}
        </div>
      </div>
    </div>
  )
}

export const AllItemSkeleton = (
  <div className={`relative w-full select-none ${readableContentMaxWidth}`}>
    <div className="group relative flex py-4">
      <Skeleton className="mr-2 size-5 shrink-0 overflow-hidden" />
      <div className="-mt-0.5 line-clamp-4 flex-1 text-sm leading-tight">
        <div className="flex gap-1 text-[10px] font-bold text-material-opaque">
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
    <div className="relative mr-1 flex shrink-0 items-center text-[15px]">
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
          <i className="i-mgc-video-cute-fi mr-1 shrink-0 text-base text-text/90" />
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

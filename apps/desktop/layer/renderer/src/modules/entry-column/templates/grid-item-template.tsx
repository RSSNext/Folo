import { TitleMarquee } from "@follow/components/ui/marquee/index.jsx"
import { useIsEntryStarred } from "@follow/store/collection/hooks"
import { useEntry, useHasEntry } from "@follow/store/entry/hooks"
import { useFeedById } from "@follow/store/feed/hooks"
import { cn } from "@follow/utils/utils"
import dayjs from "dayjs"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { useUISettingKey } from "~/atoms/settings/ui"
import { useEntryIsRead } from "~/hooks/biz/useAsRead"
import { EntryTranslation } from "~/modules/entry-column/translation"
import type { FeedIconEntry } from "~/modules/feed/feed-icon"
import { FeedIcon } from "~/modules/feed/feed-icon"
import { FeedTitle } from "~/modules/feed/feed-title"

import { StarIcon } from "../star-icon"
import type { UniversalItemProps } from "../types"

interface GridItemProps extends UniversalItemProps {
  children?: React.ReactNode
  wrapperClassName?: string
}
export function GridItem(props: GridItemProps) {
  const { entryId, wrapperClassName, children, translation } = props
  const hasEntry = useHasEntry(entryId)

  if (!hasEntry) return null
  return (
    <div className={cn("p-1.5", wrapperClassName)}>
      {children}
      <GridItemFooter entryId={entryId} translation={translation} />
    </div>
  )
}

export const GridItemFooter = ({
  entryId,
  translation,
  titleClassName,
  descriptionClassName,
  timeClassName,
}: Pick<GridItemProps, "entryId" | "translation"> & {
  titleClassName?: string
  descriptionClassName?: string
  timeClassName?: string
}) => {
  const entry = useEntry(entryId, (state) => {
    /// keep-sorted
    const { authorAvatar, feedId, publishedAt, title } = state

    const media = state.media || []
    const photo = media.find((a) => a.type === "photo")
    const firstPhotoUrl = photo?.url

    /// keep-sorted
    return {
      authorAvatar,
      feedId,
      firstPhotoUrl,
      publishedAt,
      title,
    }
  })

  const isInCollection = useIsEntryStarred(entryId)

  const feeds = useFeedById(entry?.feedId)

  const asRead = useEntryIsRead(entryId)

  const iconEntry: FeedIconEntry = useMemo(
    () => ({
      firstPhotoUrl: entry?.firstPhotoUrl,
      authorAvatar: entry?.authorAvatar,
    }),
    [entry?.firstPhotoUrl, entry?.authorAvatar],
  )

  const { t } = useTranslation("common")

  const isImageOnly = useUISettingKey("pictureViewImageOnly")
  if (isImageOnly) return null

  if (!entry) return null
  return (
    <div className={cn("relative px-2 text-sm")}>
      <div className="flex items-center">
        <div
          className={cn(
            "mr-1 size-1.5 shrink-0 self-center rounded-full bg-accent duration-200",
            asRead && "mr-0 w-0",
          )}
        />
        <div
          className={cn(
            "relative mb-1 mt-1.5 flex w-full items-center gap-1 truncate font-medium",
            titleClassName,
          )}
        >
          <TitleMarquee className="min-w-0 grow">
            <EntryTranslation source={entry?.title} target={translation?.title} />
          </TitleMarquee>
          {isInCollection && (
            <div className="h-0 shrink-0 -translate-y-2">
              <StarIcon />
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 truncate text-[13px]">
        <FeedIcon fallback noMargin className="flex" target={feeds} entry={iconEntry} size={18} />
        <span className={cn("min-w-0 truncate pl-1", descriptionClassName)}>
          <FeedTitle feed={feeds} />
        </span>
        <span className={cn("text-zinc-500", timeClassName)}>·</span>
        <span className={cn("text-zinc-500", timeClassName)}>
          {dayjs.duration(dayjs(entry?.publishedAt).diff(dayjs(), "minute"), "minute").humanize()}
          {t("space")}
          {t("words.ago")}
        </span>
      </div>
    </div>
  )
}

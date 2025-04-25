import { TitleMarquee } from "@follow/components/ui/marquee/index.jsx"
import { cn } from "@follow/utils/utils"
import dayjs from "dayjs"

import { useEntryIsRead } from "~/hooks/biz/useAsRead"
import { EntryTranslation } from "~/modules/entry-column/translation"
import { FeedIcon } from "~/modules/feed/feed-icon"
import { FeedTitle } from "~/modules/feed/feed-title"
import { useEntry } from "~/store/entry/hooks"
import { useFeedById } from "~/store/feed"

import { StarIcon } from "../star-icon"
import type { UniversalItemProps } from "../types"

interface GridItemProps extends UniversalItemProps {
  children?: React.ReactNode
  wrapperClassName?: string
}
export function GridItem(props: GridItemProps) {
  const { entryId, entryPreview, wrapperClassName, children, translation } = props
  const entry = useEntry(entryId) || entryPreview

  if (!entry) return null
  return (
    <div className={cn("p-1.5", wrapperClassName)}>
      {children}
      <GridItemFooter entryId={entryId} entryPreview={entryPreview} translation={translation} />
    </div>
  )
}

export const GridItemFooter = ({
  entryId,
  entryPreview,
  translation,

  // classNames

  titleClassName,
  descriptionClassName,
  timeClassName,
}: Pick<GridItemProps, "entryId" | "entryPreview" | "translation"> & {
  titleClassName?: string
  descriptionClassName?: string
  timeClassName?: string
}) => {
  const entry = useEntry(entryId) || entryPreview
  const feeds = useFeedById(entry?.feedId)

  const asRead = useEntryIsRead(entry)

  if (!entry) return null
  return (
    <div className={cn("relative px-2 text-sm")}>
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
            titleClassName,
          )}
        >
          <TitleMarquee className="min-w-0 grow">
            <EntryTranslation source={entry.entries.title} target={translation?.title} />
          </TitleMarquee>
          {!!entry.collections && (
            <div className="h-0 shrink-0 -translate-y-2">
              <StarIcon />
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 truncate text-[13px]">
        <FeedIcon fallback className="mr-0.5 flex" feed={feeds!} entry={entry.entries} size={18} />
        <span className={cn("min-w-0 truncate", descriptionClassName)}>
          <FeedTitle feed={feeds} />
        </span>
        <span className={cn("text-zinc-500", timeClassName)}>·</span>
        <span className={cn("text-zinc-500", timeClassName)}>
          {dayjs
            .duration(dayjs(entry.entries.publishedAt).diff(dayjs(), "minute"), "minute")
            .humanize()}
        </span>
      </div>
    </div>
  )
}

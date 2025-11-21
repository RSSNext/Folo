import { Button } from "@follow/components/ui/button/index.js"
import { ScrollArea } from "@follow/components/ui/scroll-area/ScrollArea.js"
import { SegmentGroup, SegmentItem } from "@follow/components/ui/segment/index.js"
import { FeedViewType } from "@follow/constants"
import type { EntryTagSummary } from "@follow/database/schemas/types"
import { useEntryTagsQuery } from "@follow/store/entry/hooks"
import { cn } from "@follow/utils"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { titleCase } from "title-case"

import { useModalStack } from "~/components/ui/modal/stacked/hooks"

import { EntryItemSkeleton } from "../entry-column/EntryItemSkeleton"
import { EntryItem } from "../entry-column/item"

type TagKind = "category" | "topic"

interface EntryTagsProps {
  tags?: EntryTagSummary | null
  feedId?: string | null
  size?: "sm" | "md"
  className?: string
}

const normalizeLabel = (label: string) => titleCase(label.replaceAll(/[_-]+/g, " "))

const chipClassName: Record<NonNullable<EntryTagsProps["size"]>, string> = {
  sm: "px-2 py-0.5 text-[11px]",
  md: "px-2.5 py-1 text-xs",
}

type TagItem = { label: string; kind: TagKind }

const TagEntriesModal = ({ tag, feedId }: { tag: TagItem; feedId?: string | null }) => {
  const { t } = useTranslation()
  const [scope, setScope] = useState<"current" | "all">("current")
  const currentFeedId = scope === "current" ? feedId : undefined

  const { data, isLoading, isFetching, refetch } = useEntryTagsQuery({
    feedId: currentFeedId,
    tag:
      tag.kind === "category"
        ? { kind: "schemaOrgCategory", value: tag.label }
        : { kind: "mediaTopic", value: tag.label },
  })

  const entryIds = data ?? []

  return (
    <div className="-mx-4 -mb-4 w-[min(720px,calc(100vw-2rem))] space-y-4">
      <div className="flex items-center justify-between gap-2 px-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="min-w-0 text-sm text-text-secondary">
            Entries tagged with {normalizeLabel(tag.label)}
          </div>
          {feedId && (
            <SegmentGroup value={scope} onValueChanged={(v) => setScope(v as "current" | "all")}>
              <SegmentItem value="current" label={t("entry_tags.current_feed")} />
              <SegmentItem value="all" label={t("entry_tags.all_feeds")} />
            </SegmentGroup>
          )}
        </div>
        <Button size="sm" variant="ghost" onClick={() => refetch()} disabled={isFetching}>
          <i
            className={cn(
              "i-mingcute-loading-line mr-1 size-4",
              isFetching && "animate-spin text-text-secondary",
            )}
          />
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <EntryItemSkeleton view={FeedViewType.All} count={3} />
        </div>
      ) : entryIds.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-6 text-sm text-text-secondary">
          <i className="i-mgc-inbox-cute-re text-xl" />
          <span>No entries found for this tag.</span>
        </div>
      ) : (
        <ScrollArea rootClassName="h-[70vh] w-full" flex viewportClassName="pb-4">
          {entryIds.map((entryId) => (
            <EntryItem key={entryId} entryId={entryId} view={FeedViewType.All} />
          ))}
        </ScrollArea>
      )}
    </div>
  )
}

export const EntryTags = ({
  tags,
  size = "md",
  className,

  feedId,
}: EntryTagsProps) => {
  const { present } = useModalStack()

  const items = useMemo(() => {
    if (!tags) return []
    const list: TagItem[] = []
    if (tags.schemaOrgCategory) {
      list.push({ label: tags.schemaOrgCategory, kind: "category" })
    }
    if (Array.isArray(tags.mediaTopics)) {
      for (const topic of tags.mediaTopics) {
        if (topic) {
          list.push({ label: topic, kind: "topic" })
        }
      }
    }
    return list
  }, [tags])
  if (!tags) return null
  if (items.length === 0) return null

  const handleClick = (item: TagItem, event: React.MouseEvent) => {
    event.stopPropagation()
    event.preventDefault()
    if (!feedId) return
    present({
      title: `Tag · ${normalizeLabel(item.label)}`,
      content: () => <TagEntriesModal tag={item} feedId={feedId} />,
      clickOutsideToDismiss: true,
      overlay: true,
      modal: true,
      modalClassName: "max-w-[760px]",
    })
  }

  return (
    <div
      className={cn("flex min-w-0 flex-wrap items-center gap-1.5 text-text-secondary", className)}
    >
      {items.map((item, index) => (
        <button
          key={`${item.kind}-${item.label}-${index}`}
          type="button"
          onClick={(event) => handleClick(item, event)}
          className={cn(
            "cursor-pointer truncate rounded-full bg-fill-secondary text-text-secondary transition-colors duration-200 hover:bg-fill-tertiary hover:text-text",
            chipClassName[size],
          )}
        >
          {item.kind === "category"
            ? `Category · ${normalizeLabel(item.label)}`
            : normalizeLabel(item.label)}
        </button>
      ))}
    </div>
  )
}

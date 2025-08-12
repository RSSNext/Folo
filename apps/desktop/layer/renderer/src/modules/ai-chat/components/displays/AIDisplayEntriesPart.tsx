import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@follow/components/ui/card/index.js"
import { entrySyncServices } from "@follow/store/entry/store"
import dayjs from "dayjs"
import { memo } from "react"

import { usePeekModal } from "~/hooks/biz/usePeekModal"
import { FeedIcon } from "~/modules/feed/feed-icon"

import type { AIDisplayEntriesTool } from "../../store/types"
import { DisplayCardWrapper, withDisplayStateHandler } from "./share"
import { CategoryTag, EmptyState, StatCard } from "./shared"

type EntryData = AIDisplayEntriesTool["output"]["entries"]
type EntryItem = EntryData[number]

interface EntryCardProps {
  item: EntryItem
  showSummary: boolean
  showMetadata: boolean
}

const formatDisplayType = (displayType: string) => {
  const displayTypeMap = {
    timeline: "Timeline View",
    list: "List View",
    grid: "Grid View",
    card: "Card View",
    magazine: "Magazine View",
  }
  return displayTypeMap[displayType as keyof typeof displayTypeMap] || displayType
}

const formatGroupBy = (groupBy: string) => {
  const groupByMap = {
    date: "By Date",
    feed: "By Feed",
    none: "No Grouping",
  }
  return groupByMap[groupBy as keyof typeof groupByMap] || groupBy
}

const EntriesGrid = ({
  data,
  showSummary,
  showMetadata,
}: {
  data: EntryData
  showSummary: boolean
  showMetadata: boolean
}) => {
  if (!data?.length) {
    return <EmptyState message="No entries found" />
  }

  return (
    <div className="@[600px]:grid-cols-2 @[900px]:grid-cols-3 grid grid-cols-1 gap-4">
      {data.map((item) => (
        <EntryCard
          key={item.entry.id}
          item={item}
          showSummary={showSummary}
          showMetadata={showMetadata}
        />
      ))}
    </div>
  )
}

const EntryCard = memo(({ item, showSummary, showMetadata }: EntryCardProps) => {
  const peekModal = usePeekModal()
  return (
    <Card
      key={item.entry.id}
      className="hover:bg-fill-tertiary cursor-pointer p-4"
      onMouseEnter={() => entrySyncServices.fetchEntryDetail(item.entry.id)}
      onClick={() => peekModal(item.entry.id, "modal")}
    >
      <CardHeader className="h-auto px-2 py-3">
        <div className="flex items-start gap-3">
          <FeedIcon
            feed={item.feed ? { ...item.feed, type: "feed" as const } : null}
            size={32}
            className="shrink-0"
            noMargin
          />
          <div className="-mt-1 min-w-0 flex-1">
            <CardTitle className="line-clamp-2 text-base">
              {item.entry.title || "Untitled Entry"}
            </CardTitle>
            {item.feed?.title && (
              <CardDescription className="mt-1 text-xs">{item.feed.title}</CardDescription>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 p-0 px-2 pb-3">
        {showSummary && item.entry.description && (
          <div className="text-text-secondary line-clamp-3 text-sm">{item.entry.description}</div>
        )}

        {showMetadata && (
          <div className="space-y-2">
            <div className="text-text-secondary text-xs">
              Published: {dayjs(item.entry.publishedAt).format("MMM DD, YYYY HH:mm")}
            </div>
            {item.entry.author && (
              <div className="text-text-secondary text-xs">By: {item.entry.author}</div>
            )}
            {item.entry.categories?.length && (
              <div className="flex flex-wrap gap-1">
                {item.entry.categories.slice(0, 3).map((category, index) => (
                  <CategoryTag key={index} category={category} />
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
})

const TimelineView = ({
  data,
  showSummary,
  showMetadata,
}: {
  data: EntryData
  showSummary: boolean
  showMetadata: boolean
}) => {
  const peekModal = usePeekModal()

  if (!data?.length) {
    return <EmptyState message="No entries found" />
  }

  return (
    <div className="space-y-4">
      {data.map((item) => (
        <Card
          key={item.entry.id}
          className="hover:bg-fill-tertiary cursor-pointer p-4"
          onMouseEnter={() => entrySyncServices.fetchEntryDetail(item.entry.id)}
          onClick={() => peekModal(item.entry.id, "modal")}
        >
          <div className="flex gap-4">
            <FeedIcon
              feed={item.feed ? { ...item.feed, type: "feed" as const } : null}
              size={40}
              className="shrink-0"
              noMargin
            />
            <div className="min-w-0 flex-1">
              <CardHeader className="p-0">
                <CardTitle className="text-text line-clamp-2 text-lg">
                  {item.entry.title || "Untitled Entry"}
                </CardTitle>
                <CardDescription className="flex items-center gap-2 text-sm">
                  {item.feed?.title && <span>{item.feed.title}</span>}
                  <span>•</span>
                  <span>{dayjs(item.entry.publishedAt).format("MMM DD, YYYY HH:mm")}</span>
                  {item.entry.author && (
                    <>
                      <span>•</span>
                      <span>By {item.entry.author}</span>
                    </>
                  )}
                </CardDescription>
              </CardHeader>

              <CardContent className="mt-3 p-0">
                {showSummary && item.entry.description && (
                  <div className="text-text-secondary mb-3 line-clamp-2">
                    {item.entry.description}
                  </div>
                )}

                {showMetadata && item.entry.categories?.length && (
                  <div className="flex flex-wrap gap-1">
                    {item.entry.categories.slice(0, 5).map((category, index) => (
                      <CategoryTag key={index} category={category} />
                    ))}
                  </div>
                )}
              </CardContent>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

const GroupedEntries = ({
  data,
  groupBy,
  displayType,
  showSummary,
  showMetadata,
}: {
  data: EntryData
  groupBy: string
  displayType: string
  showSummary: boolean
  showMetadata: boolean
}) => {
  if (!data?.length || groupBy === "none") {
    return null
  }

  const groups = data.reduce(
    (acc, item) => {
      let key: string
      if (groupBy === "date") {
        key = dayjs(item.entry.publishedAt).format("YYYY-MM-DD")
      } else if (groupBy === "feed") {
        key = item.feed?.title || "Unknown Feed"
      } else {
        key = "All"
      }

      if (!acc[key]) acc[key] = []
      acc[key]?.push(item)
      return acc
    },
    {} as Record<string, EntryData>,
  )

  const renderGroup = (groupData: EntryData) => {
    if (displayType === "timeline") {
      return <TimelineView data={groupData} showSummary={showSummary} showMetadata={showMetadata} />
    }
    return <EntriesGrid data={groupData} showSummary={showSummary} showMetadata={showMetadata} />
  }

  return (
    <div className="space-y-6">
      {Object.entries(groups)
        .sort(([a], [b]) => {
          if (groupBy === "date") {
            return dayjs(b).isAfter(dayjs(a)) ? 1 : -1
          }
          return a.localeCompare(b)
        })
        .map(([groupName, groupData]) => (
          <div key={groupName}>
            <h3 className="text-text mb-4 text-lg font-semibold">
              {groupBy === "date" ? dayjs(groupName).format("MMMM DD, YYYY") : groupName}
            </h3>
            {renderGroup(groupData)}
          </div>
        ))}
    </div>
  )
}

const AIDisplayEntriesPartBase = ({
  output,
}: {
  output: NonNullable<AIDisplayEntriesTool["output"]>
}) => {
  const {
    entries,
    displayType = "grid",
    showSummary = true,
    showMetadata = true,
    title,
    groupBy = "none",
  } = output

  // Calculate statistics
  const totalEntries = entries.length
  const feedsCount = new Set(entries.map((e) => e.entry.feedId)).size
  const authorsCount = new Set(entries.map((e) => e.entry.author).filter(Boolean)).size
  const categoriesCount = new Set(entries.flatMap((e) => e.entry.categories || [])).size

  const renderEntries = () => {
    if (groupBy !== "none") {
      return (
        <GroupedEntries
          data={entries}
          groupBy={groupBy}
          displayType={displayType}
          showSummary={showSummary}
          showMetadata={showMetadata}
        />
      )
    }

    if (displayType === "timeline") {
      return <TimelineView data={entries} showSummary={showSummary} showMetadata={showMetadata} />
    }
    return <EntriesGrid data={entries} showSummary={showSummary} showMetadata={showMetadata} />
  }

  return (
    <DisplayCardWrapper
      title={title || "Entries"}
      emoji="📰"
      description={`${formatDisplayType(displayType)} • ${formatGroupBy(groupBy)} • ${totalEntries} entries`}
    >
      {/* Statistics Overview */}
      <div className="@[600px]:grid-cols-4 @[400px]:grid-cols-2 grid grid-cols-1 gap-4">
        <StatCard title="Total Entries" value={totalEntries} emoji="📄" />
        <StatCard title="Feeds" value={feedsCount} emoji="📡" />
        <StatCard title="Authors" value={authorsCount} emoji="✍️" />
        <StatCard title="Categories" value={categoriesCount} emoji="🏷️" />
      </div>

      {/* Entries Display */}
      {renderEntries()}
    </DisplayCardWrapper>
  )
}

export const AIDisplayEntriesPart = withDisplayStateHandler<AIDisplayEntriesTool["output"]>({
  title: "Entries",
  loadingDescription: "Fetching entry data...",
  errorTitle: "Entries Error",
})(AIDisplayEntriesPartBase)

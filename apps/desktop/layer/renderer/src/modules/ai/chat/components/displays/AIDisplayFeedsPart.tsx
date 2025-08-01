import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@follow/components/ui/card/index.js"
import dayjs from "dayjs"
import { memo } from "react"

import { FeedIcon } from "~/modules/feed/feed-icon"

import type { AIDisplayFeedsTool } from "../../__internal__/types"
import { ErrorState, LoadingState } from "../common-states"
import { AnalyticsMetrics, EmptyState, StatCard } from "./shared"

type FeedData = AIDisplayFeedsTool["output"]["feeds"]

const FeedsGrid = ({ data, showAnalytics }: { data: FeedData; showAnalytics: boolean }) => {
  if (!data?.length) {
    return <EmptyState message="No feeds found" />
  }

  return (
    <div className="@[600px]:grid-cols-3 grid grid-cols-2 gap-4 md:grid-cols-3">
      {data.map((item) => (
        <Card key={item.feed.id} className="p-4">
          <CardHeader className="h-24 px-2 py-3">
            <div className="flex items-start gap-3">
              <FeedIcon
                feed={item.feed ? { ...item.feed, type: "feed" as const } : null}
                size={32}
                className="shrink-0"
                noMargin
              />
              <div className="-mt-1 min-w-0 flex-1">
                <CardTitle className="line-clamp-2 text-base">
                  {item.feed.title || "Unknown Feed"}
                </CardTitle>
                {item.feed.description && (
                  <CardDescription className="mt-1 line-clamp-2 text-xs">
                    {item.feed.description}
                  </CardDescription>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-3 p-0 px-2 pb-3">
            {item.feed.errorMessage && (
              <div className="bg-red/10 text-red rounded px-2 py-1 text-xs">
                Error: {item.feed.errorMessage}
              </div>
            )}

            <div className="text-text-secondary text-xs">
              Last checked: {dayjs(item.feed.checkedAt).format("MMM DD, YYYY HH:mm")}
            </div>

            {item.feed.language && (
              <div className="text-text-secondary text-xs">Language: {item.feed.language}</div>
            )}

            {showAnalytics && item.analytics && (
              <AnalyticsMetrics
                metrics={[
                  { label: "Updates/Week", value: item.analytics.updatesPerWeek || 0 },
                  { label: "Subscribers", value: item.analytics.subscriptionCount || 0 },
                  { label: "Views", value: item.analytics.view || 0 },
                ]}
              />
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export const AIDisplayFeedsPart = memo(({ part }: { part: AIDisplayFeedsTool }) => {
  // Handle error state
  if (part.state === "output-error") {
    return (
      <ErrorState
        title="Feeds Error"
        error="An error occurred while loading feeds"
        maxWidth="max-w-6xl"
      />
    )
  }

  // Handle no output or invalid state
  if (part.state !== "output-available" || !part.output) {
    return (
      <LoadingState
        title="Loading Feeds..."
        description="Fetching feed data..."
        maxWidth="max-w-6xl"
      />
    )
  }

  // Extract output with proper typing
  const output = part.output as NonNullable<AIDisplayFeedsTool["output"]>

  const { feeds, displayType = "list", showAnalytics = true, title } = output

  // Calculate statistics
  const totalFeeds = feeds.length
  const activeFeeds = feeds.filter((f) => !f.feed.errorMessage).length
  const errorFeeds = feeds.filter((f) => f.feed.errorMessage).length
  const totalSubscriptions = feeds.reduce(
    (acc, f) => acc + (f.analytics?.subscriptionCount || 0),
    0,
  )
  const totalViews = feeds.reduce((acc, f) => acc + (f.analytics?.view || 0), 0)

  const renderFeeds = () => {
    switch (displayType) {
      default: {
        return <FeedsGrid data={feeds} showAnalytics={showAnalytics} />
      }
    }
  }

  return (
    <Card className="mb-2 w-full min-w-0">
      <div className="w-[9999px] max-w-[calc(var(--ai-chat-layout-width,65ch)_-120px)]" />
      <CardHeader>
        <CardTitle className="text-text flex items-center gap-2 text-xl font-semibold">
          <span className="text-lg">📡</span>
          <span>{title || "RSS Feeds"}</span>
        </CardTitle>
        <CardDescription>{totalFeeds} feeds</CardDescription>
      </CardHeader>
      <CardContent className="@container space-y-6">
        {/* Statistics Overview */}
        <div className="@[600px]:grid-cols-4 grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard title="Total Feeds" value={totalFeeds} emoji="📊" />
          <StatCard
            title="Active Feeds"
            value={activeFeeds}
            description={`${errorFeeds} with errors`}
            emoji="🟢"
          />
          {showAnalytics && (
            <>
              <StatCard
                title="Total Subscribers"
                value={totalSubscriptions.toLocaleString()}
                emoji="👥"
              />
              <StatCard title="Total Views" value={totalViews.toLocaleString()} emoji="👀" />
            </>
          )}
        </div>

        {/* Feeds Display */}
        {renderFeeds()}
      </CardContent>
    </Card>
  )
})

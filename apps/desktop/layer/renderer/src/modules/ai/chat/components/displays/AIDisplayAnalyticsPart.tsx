import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@follow/components/ui/card/index.js"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@follow/components/ui/table/index.js"
import dayjs from "dayjs"

import type { AIDisplayAnalyticsTool } from "../../__internal__/types"
import { ErrorState, LoadingState } from "../common-states"
import { ChartPlaceholder, StatCard } from "./shared"

type AnalyticsData = AIDisplayAnalyticsTool["output"]["analyticsData"]

const formatTimeRange = (timeRange: string) => {
  const timeRangeMap = {
    "7d": "Last 7 days",
    "30d": "Last 30 days",
    "90d": "Last 90 days",
    "1y": "Last year",
    all: "All time",
  }
  return timeRangeMap[timeRange as keyof typeof timeRangeMap] || timeRange
}

const FeedAnalytics = ({ data }: { data: AnalyticsData["feedData"] }) => {
  if (!data) return null

  const { feed, analytics } = data

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          title="Feed Title"
          value={feed.title || "Untitled Feed"}
          description={feed.description || ""}
          emoji="📰"
        />
        <StatCard title="Subscribers" value={analytics?.subscriptionCount || 0} emoji="👥" />
        <StatCard title="Updates per Week" value={analytics?.updatesPerWeek || 0} emoji="📅" />
      </div>

      {analytics && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <StatCard title="Views" value={analytics.view || 0} emoji="👀" />
          <StatCard
            title="Last Checked"
            value={feed.checkedAt ? dayjs(feed.checkedAt).format("MMM DD, YYYY") : "N/A"}
            emoji="🔄"
          />
        </div>
      )}
    </div>
  )
}

const SubscriptionAnalytics = ({ data }: { data: AnalyticsData["subscriptionStats"] }) => {
  if (!data?.length) return null

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard title="Total Subscriptions" value={data.length} emoji="📊" />
        <StatCard title="Active Feeds" value={data.filter((s) => s.feed).length} emoji="🟢" />
        <StatCard
          title="Average Subscribers"
          value={Math.round(
            data.reduce((acc, s) => acc + (s.analytics?.subscriptionCount || 0), 0) / data.length,
          )}
          emoji="📈"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Subscription Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Feed</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Subscribers</TableHead>
                <TableHead>Updates/Week</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.slice(0, 10).map((sub) => (
                <TableRow key={sub.subscription?.userId || sub.feed?.id}>
                  <TableCell className="font-medium">{sub.feed?.title || "Unknown Feed"}</TableCell>
                  <TableCell>{sub.subscription?.category || "No Category"}</TableCell>
                  <TableCell>{sub.analytics?.subscriptionCount || 0}</TableCell>
                  <TableCell>{sub.analytics?.updatesPerWeek || 0}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {data.length > 10 && (
            <div className="text-text-tertiary mt-2 text-sm">
              Showing 10 of {data.length} subscriptions
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

const ReadingAnalytics = ({ data }: { data: AnalyticsData["readingStats"] }) => {
  if (!data?.length) return null

  const totalReads = data.reduce((acc, stat) => acc + stat.count, 0)
  const averageReads = Math.round(totalReads / data.length)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard title="Total Reads" value={totalReads} emoji="📖" />
        <StatCard title="Average Daily Reads" value={averageReads} emoji="📊" />
        <StatCard title="Active Days" value={data.length} emoji="🗓️" />
      </div>

      <ChartPlaceholder title="Reading Activity Over Time" data={data} />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Reading Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Reads</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.slice(0, 7).map((stat) => (
                <TableRow key={stat.date}>
                  <TableCell className="font-medium">
                    {dayjs(stat.date).format("MMM DD, YYYY")}
                  </TableCell>
                  <TableCell>{stat.count}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

const TrendingAnalytics = ({ data }: { data: AnalyticsData["trendingFeeds"] }) => {
  if (!data?.length) return null

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard title="Trending Feeds" value={data.length} emoji="🔥" />
        <StatCard
          title="Top Feed Subscribers"
          value={data[0]?.analytics?.subscriptionCount || 0}
          description={data[0]?.feed?.title || ""}
          emoji="👑"
        />
        <StatCard
          title="Total Views"
          value={data.reduce((acc, feed) => acc + (feed.analytics?.view || 0), 0)}
          emoji="👀"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Trending Feeds</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Feed</TableHead>
                <TableHead>Subscribers</TableHead>
                <TableHead>Updates/Week</TableHead>
                <TableHead>Views</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((feed) => (
                <TableRow key={feed.feed?.id}>
                  <TableCell className="font-medium">
                    {feed.feed?.title || "Unknown Feed"}
                  </TableCell>
                  <TableCell>{feed.analytics?.subscriptionCount || 0}</TableCell>
                  <TableCell>{feed.analytics?.updatesPerWeek || 0}</TableCell>
                  <TableCell>{feed.analytics?.view || 0}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

const OverviewAnalytics = ({ data }: { data: AnalyticsData["overviewStats"] }) => {
  if (!data) return null

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard title="Total Feeds" value={data.totalFeeds || 0} emoji="📰" />
        <StatCard title="Total Subscriptions" value={data.totalSubscriptions || 0} emoji="📊" />
        <StatCard title="Total Reads" value={data.totalReads || 0} emoji="📖" />
      </div>
    </div>
  )
}

export const AIDisplayAnalyticsPart = ({ part }: { part: AIDisplayAnalyticsTool }) => {
  // Handle loading state
  if (part.state === "input-streaming" || part.state === "input-available") {
    return (
      <LoadingState
        title="Loading Analytics..."
        description="Fetching analytics data..."
        maxWidth="max-w-4xl"
      />
    )
  }

  // Handle error state
  if (part.state === "output-error") {
    return (
      <ErrorState
        title="Analytics Error"
        error={
          typeof part.output === "string"
            ? part.output
            : "An error occurred while loading analytics"
        }
        maxWidth="max-w-4xl"
      />
    )
  }

  // Handle no output
  const { output } = part
  if (!output) {
    return (
      <LoadingState
        title="Loading Analytics..."
        description="Fetching analytics data..."
        maxWidth="max-w-4xl"
      />
    )
  }

  const { analyticsData, analyticsType, timeRange, displayType, title } = output

  const renderAnalytics = () => {
    switch (analyticsType) {
      case "feed": {
        return <FeedAnalytics data={analyticsData.feedData} />
      }
      case "subscription": {
        return <SubscriptionAnalytics data={analyticsData.subscriptionStats} />
      }
      case "reading": {
        return <ReadingAnalytics data={analyticsData.readingStats} />
      }
      case "trending": {
        return <TrendingAnalytics data={analyticsData.trendingFeeds} />
      }
      case "overview": {
        return <OverviewAnalytics data={analyticsData.overviewStats} />
      }
      default: {
        return <div className="text-text-secondary">No analytics data available</div>
      }
    }
  }

  return (
    <Card className="mx-auto mb-2 w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="text-text flex items-center gap-2 text-xl font-semibold">
          <span className="text-lg">📊</span>
          <span>
            {title || `${analyticsType.charAt(0).toUpperCase() + analyticsType.slice(1)} Analytics`}
          </span>
        </CardTitle>
        <CardDescription>
          {formatTimeRange(timeRange)} • Display type: {displayType}
        </CardDescription>
      </CardHeader>
      <CardContent>{renderAnalytics()}</CardContent>
    </Card>
  )
}

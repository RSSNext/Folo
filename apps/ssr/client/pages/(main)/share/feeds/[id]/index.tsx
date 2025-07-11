import { Item } from "@client/components/items"
import { FeedCertification } from "@client/components/ui/feed-certification"
import { FeedIcon } from "@client/components/ui/feed-icon"
import { openInFollowApp } from "@client/lib/helper"
import { useFeed } from "@client/query/feed"
import { FollowIcon } from "@follow/components/icons/follow.jsx"
import { Button } from "@follow/components/ui/button/index.jsx"
import { RelativeTime } from "@follow/components/ui/datetime/index.jsx"
import { LoadingCircle } from "@follow/components/ui/loading/index.jsx"
import { useTitle } from "@follow/hooks"
import { cn } from "@follow/utils/utils"
import { Fragment } from "react"
import { useTranslation } from "react-i18next"
import { useParams, useSearchParams } from "react-router"

const numberFormatter = new Intl.NumberFormat()
export function Component() {
  const { id } = useParams()
  const [search] = useSearchParams()

  const { t } = useTranslation()

  const feed = useFeed({
    id: id!,
  })
  const view = Number.parseInt(search.get("view") || feed.data?.analytics?.view?.toString() || "0")

  const feedData = feed.data?.feed
  const analytics = feed.data?.analytics
  const isSubscribed = !!feed.data?.subscription
  const entries = feed.data?.entries.map((entry) => ({
    ...entry,
    id: entry.guid,
    content: entry.description,
    feedId: feed.data?.feed.id,
    insertedAt: entry.publishedAt,
  }))

  useTitle(feed.data?.feed.title)

  if (feed.isLoading || !feed.data?.feed || !feedData) {
    return <LoadingCircle size="large" className="center fixed inset-0" />
  }

  return (
    <Fragment>
      {/* Hero Section */}
      <div>
        <div className="mx-auto max-w-4xl px-6 py-8 text-center sm:px-8 sm:py-12">
          {/* Feed Icon */}
          <div className="mb-6">
            <div className="relative mx-auto inline-block">
              <FeedIcon
                fallback
                feed={feedData}
                className="mask-squircle mask border-border border"
                noMargin
                size={80}
              />
            </div>
          </div>

          {/* Feed Info */}
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-3xl font-semibold text-zinc-900 sm:text-4xl dark:text-zinc-100">
                {feedData.title}
              </h1>
              <FeedCertification feed={feedData} />
            </div>

            <p className="break-all text-base text-zinc-500 dark:text-zinc-400">{feedData.url}</p>

            {feedData.description && (
              <p className="mx-auto max-w-2xl text-balance text-zinc-600 dark:text-zinc-400">
                {feedData.description}
              </p>
            )}

            {/* Stats */}
            <div className="!mt-8 flex justify-center">
              <div className="divide-material-ultra-thick flex items-center divide-x">
                {!!analytics?.subscriptionCount && (
                  <div className="px-4 text-center">
                    <div className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                      {numberFormatter.format(analytics.subscriptionCount)}
                    </div>
                    <div className="text-sm text-zinc-500 dark:text-zinc-400">
                      {t("feed.follower", { count: analytics.subscriptionCount })}
                    </div>
                  </div>
                )}

                {analytics?.updatesPerWeek ? (
                  <div className="px-4 text-center">
                    <div className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                      {analytics.updatesPerWeek}
                    </div>
                    <div className="text-sm text-zinc-500 dark:text-zinc-400">
                      {analytics.updatesPerWeek > 1 ? "entries" : "entry"}/week
                    </div>
                  </div>
                ) : analytics?.latestEntryPublishedAt ? (
                  <div className="px-4 text-center">
                    <div className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
                      <RelativeTime
                        date={analytics.latestEntryPublishedAt}
                        displayAbsoluteTimeAfterDay={Infinity}
                      />
                    </div>
                    <div className="text-sm text-zinc-500 dark:text-zinc-400">
                      {t("feed.updated_at")}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Follow Button */}
            <div className="!mt-8">
              <Button
                variant={isSubscribed ? "outline" : "primary"}
                size="lg"
                onClick={() => {
                  openInFollowApp({
                    deeplink: `feed?id=${id}&view=${view}`,
                    fallbackUrl: `/timeline/view-${view}/${id}/pending`,
                  })
                }}
              >
                <FollowIcon className="mr-2 size-4" />
                {isSubscribed
                  ? t("feed.actions.followed")
                  : t("feed.actions.open", { which: APP_NAME })}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Entries Section */}
      <div className={cn("w-full pb-12 pt-8", "flex flex-col gap-2")}>
        <Item entries={entries} feed={feed.data} view={view} />
      </div>
    </Fragment>
  )
}

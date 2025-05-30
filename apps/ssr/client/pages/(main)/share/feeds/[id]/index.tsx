import { Item } from "@client/components/items"
import { MainContainer } from "@client/components/layout/main"
import { FeedCertification } from "@client/components/ui/feed-certification"
import { FeedIcon } from "@client/components/ui/feed-icon"
import { openInFollowApp } from "@client/lib/helper"
import { useEntriesPreview } from "@client/query/entries"
import { useFeed } from "@client/query/feed"
import { FollowIcon } from "@follow/components/icons/follow.jsx"
import { Button } from "@follow/components/ui/button/index.jsx"
import { RelativeTime } from "@follow/components/ui/datetime/index.jsx"
import { LoadingCircle } from "@follow/components/ui/loading/index.jsx"
import { useTitle } from "@follow/hooks"
import { cn } from "@follow/utils/utils"
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
  const entries = useEntriesPreview({
    id,
  })

  useTitle(feed.data?.feed.title)

  if (feed.isLoading || !feed.data?.feed || !feedData) {
    return <LoadingCircle size="large" className="center fixed inset-0" />
  }

  return (
    <MainContainer className="items-center">
      <div className="w-full max-w-full">
        <div className="mx-auto my-4 flex max-w-prose flex-col items-center space-y-5">
          <FeedIcon
            fallback
            feed={feedData}
            className="mask-squircle mask shrink-0"
            noMargin
            size={64}
          />
          <div className="flex flex-col items-center space-y-1">
            <div className="flex items-center text-2xl font-bold">
              <h1>{feedData.title}</h1>
              <FeedCertification feed={feedData} />
            </div>
            <div className="break-all text-center text-sm text-zinc-500">{feedData.url}</div>
          </div>
          <div className="line-clamp-2 text-balance text-center text-zinc-600">
            {feedData.description}
          </div>

          <div className="flex justify-between gap-4">
            <div className="flex items-center gap-4 text-base text-zinc-500 dark:text-zinc-400">
              {!!analytics?.subscriptionCount && (
                <div className="flex items-center gap-1">
                  <i className="i-mgc-user-3-cute-re" />

                  <span>
                    {numberFormatter.format(analytics.subscriptionCount)}{" "}
                    {t("feed.follower", { count: analytics.subscriptionCount })}
                  </span>
                </div>
              )}
              {analytics?.updatesPerWeek ? (
                <div className="flex items-center gap-1">
                  <i className="i-mgc-safety-certificate-cute-re" />
                  <span>{t("feed.entry_week", { count: analytics.updatesPerWeek ?? 0 })}</span>
                </div>
              ) : analytics?.latestEntryPublishedAt ? (
                <div className="flex items-center gap-1">
                  <i className="i-mgc-safe-alert-cute-re" />
                  <span>{t("feed.updated_at")}</span>
                  <RelativeTime
                    date={analytics.latestEntryPublishedAt}
                    displayAbsoluteTimeAfterDay={Infinity}
                  />
                </div>
              ) : null}
            </div>
          </div>
          <div className="center flex gap-4">
            <Button
              variant={isSubscribed ? "outline" : undefined}
              onClick={() => {
                openInFollowApp({
                  deeplink: `feed?id=${id}&view=${view}`,
                  fallbackUrl: `/timeline/view-${view}/${id}/pending`,
                })
              }}
              size="lg"
            >
              <FollowIcon className="mr-2 size-3" />
              {isSubscribed
                ? t("feed.actions.followed")
                : t("feed.actions.open", { which: APP_NAME })}
            </Button>
          </div>
        </div>
        <div className={cn("w-full pb-12 pt-8", "flex flex-col gap-2")}>
          {entries.isLoading && !entries.data ? (
            <LoadingCircle size="large" className="center mt-12" />
          ) : (
            <Item entries={entries.data} feed={feed.data} view={view} />
          )}
        </div>
      </div>
    </MainContainer>
  )
}

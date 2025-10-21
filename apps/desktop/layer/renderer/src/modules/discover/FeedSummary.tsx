import { Skeleton } from "@follow/components/ui/skeleton/index.js"
import type { FeedModel } from "@follow/store/feed/types"
import type { ListModel } from "@follow/store/list/types"
import { formatNumber } from "@follow/utils"
import type { FeedAnalyticsModel, ListAnalyticsSchema } from "@follow-app/client-sdk"
import type { FC } from "react"
import { useTranslation } from "react-i18next"

import { RelativeTime } from "~/components/ui/datetime"

import { FollowSummary } from "../feed/feed-summary"

export interface FeedSummaryProps {
  feed: FeedModel | ListModel

  analytics?: FeedAnalyticsModel | ListAnalyticsSchema

  showAnalytics?: boolean
  isLoading?: boolean
}
export const FeedSummary: FC<FeedSummaryProps> = ({
  feed,
  analytics,
  showAnalytics = true,
  isLoading,
}) => {
  const { t } = useTranslation("common")
  const showSkeleton = isLoading && !analytics && !("updatedAt" in feed && feed.updatedAt)

  if (!showAnalytics) {
    return (
      <div>
        <FollowSummary feed={feed} />
      </div>
    )
  }

  return (
    <div>
      <FollowSummary feed={feed} />

      <div className="mt-2 flex h-6 justify-between gap-4 pl-10 text-callout">
        {showSkeleton ? (
          <Skeleton className="mt-1 h-5 w-40" />
        ) : (
          <div className="flex items-center gap-3 text-text-secondary">
            {!!analytics?.subscriptionCount && (
              <div className="flex items-center gap-1.5">
                <i className="i-mgc-user-3-cute-re" />

                <span>
                  {formatNumber(analytics.subscriptionCount)}{" "}
                  {t("feed.follower", { count: analytics.subscriptionCount })}
                </span>
              </div>
            )}
            {analytics && "updatesPerWeek" in analytics && analytics?.updatesPerWeek ? (
              <div className="flex items-center gap-1.5">
                <i className="i-mgc-safety-certificate-cute-re" />
                <span>{t("feed.entry_week", { count: analytics.updatesPerWeek ?? 0 })}</span>
              </div>
            ) : analytics &&
              "latestEntryPublishedAt" in analytics &&
              analytics?.latestEntryPublishedAt ? (
              <div className="flex items-center gap-1.5">
                <i className="i-mgc-safe-alert-cute-re" />
                <span>{t("feed.updated_at")}</span>
                <RelativeTime
                  date={analytics.latestEntryPublishedAt}
                  displayAbsoluteTimeAfterDay={Infinity}
                />
              </div>
            ) : null}
            {"updatedAt" in feed && feed.updatedAt ? (
              <div className="flex items-center gap-1.5">
                <i className="i-mgc-safety-certificate-cute-re" />
                <span>{t("feed.updated_at")}</span>
                <RelativeTime date={feed.updatedAt} displayAbsoluteTimeAfterDay={Infinity} />
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}

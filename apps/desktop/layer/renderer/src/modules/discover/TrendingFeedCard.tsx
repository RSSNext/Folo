import { useIsSubscribed } from "@follow/store/subscription/hooks"
import { formatNumber } from "@follow/utils"
import type { TrendingFeedItem } from "@follow-app/client-sdk"
import type { FC } from "react"
import { useTranslation } from "react-i18next"

import { FollowSummary } from "../feed/feed-summary"
import { FeedCardActions } from "./DiscoverFeedCard"

export const TrendingFeedCard: FC<{
  item: TrendingFeedItem
}> = ({ item }) => {
  const { t } = useTranslation("common")
  const { analytics } = item
  const isSubscribed = useIsSubscribed(item.feed?.id || "")
  return (
    <div>
      <FollowSummary simple feed={item.feed! as any} />

      <div className="mt-2 flex items-center justify-between text-body text-text-secondary">
        {analytics?.subscriptionCount ? (
          <div className="flex items-center gap-1.5">
            <i className="i-mgc-user-3-cute-re" />

            <span>
              {formatNumber(analytics.subscriptionCount)}{" "}
              {t("feed.follower", { count: analytics.subscriptionCount })}
            </span>
          </div>
        ) : (
          <div />
        )}

        <FeedCardActions
          followButtonVariant="ghost"
          followedButtonClassName="px-3 -mr-3"
          followButtonClassName="border-accent text-accent px-3 -mr-3"
          isSubscribed={isSubscribed}
          item={item}
        />
      </div>
    </div>
  )
}

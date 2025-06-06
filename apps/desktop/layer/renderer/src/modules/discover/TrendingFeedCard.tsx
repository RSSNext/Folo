import type { FC } from "react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { useIsSubscribed } from "~/store/subscription"

import { FollowSummary } from "../feed/feed-summary"
import type { DiscoverItem } from "./DiscoverFeedCard"
import { FeedCardActions } from "./DiscoverFeedCard"

export const TrendingFeedCard: FC<{
  item: DiscoverItem
}> = ({ item }) => {
  const { t } = useTranslation("common")
  const { analytics } = item
  const numberFormatter = useMemo(() => new Intl.NumberFormat("en-US", {}), [])
  const isSubscribed = useIsSubscribed(item.feed?.id || item.list?.id || "")
  return (
    <div>
      <FollowSummary simple feed={item.feed!} />

      <div className="text-body text-text-secondary mt-2 flex items-center justify-between">
        {analytics?.subscriptionCount ? (
          <div className="flex items-center gap-1.5">
            <i className="i-mgc-user-3-cute-re" />

            <span>
              {numberFormatter.format(analytics.subscriptionCount)}{" "}
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

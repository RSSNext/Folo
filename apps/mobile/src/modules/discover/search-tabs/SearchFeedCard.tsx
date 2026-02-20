import { useSubscriptionByFeedId } from "@follow/store/subscription/hooks"
import { formatNumber } from "@follow/utils"
import type { DiscoveryItem, TrendingFeedItem } from "@follow-app/client-sdk"
import { useTranslation } from "react-i18next"
import { View } from "react-native"

import { RelativeDateTime } from "@/src/components/ui/datetime/RelativeDateTime"
import { Text } from "@/src/components/ui/typography/Text"
import { SafeAlertCuteReIcon } from "@/src/icons/safe_alert_cute_re"
import { SafetyCertificateCuteReIcon } from "@/src/icons/safety_certificate_cute_re"
import { User3CuteReIcon } from "@/src/icons/user_3_cute_re"
import { useColor } from "@/src/theme/colors"

import { FeedSummary } from "../FeedSummary"

export const SearchFeedCard = ({ item }: { item: TrendingFeedItem | DiscoveryItem }) => {
  const { t } = useTranslation("common")
  const isSubscribed = useSubscriptionByFeedId(item.feed?.id ?? "")
  const iconColor = useColor("secondaryLabel")
  const followerCount = item.analytics?.subscriptionCount || 0
  return (
    <FeedSummary feed={item.feed!} className="py-4 pl-4">
      <View className="mt-4 flex-row items-center gap-6">
        <View className="flex-row items-center gap-1.5">
          <User3CuteReIcon width={14} height={14} color={iconColor} />
          <Text className="text-xs text-secondary-label">
            {formatNumber(followerCount)} {t("feed.follower_other")}
          </Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          {item.analytics?.updatesPerWeek ? (
            <>
              <SafetyCertificateCuteReIcon width={14} height={14} color={iconColor} />
              <Text className="text-xs text-secondary-label">
                {t("feed.entry_week_other", { count: item.analytics.updatesPerWeek })}
              </Text>
            </>
          ) : item.analytics?.latestEntryPublishedAt ? (
            <>
              <SafeAlertCuteReIcon width={14} height={14} color={iconColor} />
              <Text className="text-xs text-secondary-label">{t("feed.updated_at")}</Text>
              <RelativeDateTime
                className="text-xs text-secondary-label"
                date={new Date(item.analytics.latestEntryPublishedAt)}
              />
            </>
          ) : null}
        </View>
        <View className="ml-auto mr-4 mt-1">
          {isSubscribed ? (
            <View className="px-5 py-2">
              <Text className="text-sm font-bold text-tertiary-label">
                {t("feed.actions.followed")}
              </Text>
            </View>
          ) : (
            <View className="rounded-full bg-accent px-5 py-2">
              <Text className="text-sm font-bold text-white">{t("feed.actions.follow")}</Text>
            </View>
          )}
        </View>
      </View>
    </FeedSummary>
  )
}

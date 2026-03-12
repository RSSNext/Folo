import { useSubscriptionByFeedId } from "@follow/store/subscription/hooks"
import { formatNumber } from "@follow/utils"
import type { DiscoveryItem, TrendingFeedItem } from "@follow-app/client-sdk"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import { Pressable, View } from "react-native"

import { RelativeDateTime } from "@/src/components/ui/datetime/RelativeDateTime"
import { Text } from "@/src/components/ui/typography/Text"
import { SafeAlertCuteReIcon } from "@/src/icons/safe_alert_cute_re"
import { SafetyCertificateCuteReIcon } from "@/src/icons/safety_certificate_cute_re"
import { User3CuteReIcon } from "@/src/icons/user_3_cute_re"
import { useNavigation } from "@/src/lib/navigation/hooks"
import { FollowScreen } from "@/src/screens/(modal)/FollowScreen"
import { useColor } from "@/src/theme/colors"

import { FeedSummary } from "../FeedSummary"

export type SearchFeedCardItem = {
  feed?: {
    id?: string | null
    title?: string | null
    url?: string | null
    image?: string | null
    ownerUserId?: string | null
    siteUrl?: string | null
    description?: string | null
  } | null
  analytics?: {
    subscriptionCount?: number | null
    latestEntryPublishedAt?: string | null
    updatesPerWeek?: number | null
  } | null
}

export const SearchFeedCard = ({
  item,
}: {
  item: SearchFeedCardItem | TrendingFeedItem | DiscoveryItem
}) => {
  const { t } = useTranslation("common")
  const isSubscribed = useSubscriptionByFeedId(item.feed?.id ?? "")
  const iconColor = useColor("secondaryLabel")
  const followerCount = item.analytics?.subscriptionCount || 0
  const navigation = useNavigation()
  const openFollow = useCallback(() => {
    if (item.feed?.id) {
      navigation.presentControllerView(FollowScreen, {
        id: item.feed.id,
        type: "feed",
      })
      return
    }

    if (item.feed?.url) {
      navigation.presentControllerView(FollowScreen, {
        url: item.feed.url,
        type: "url",
      })
    }
  }, [item.feed?.id, item.feed?.url, navigation])
  return (
    <FeedSummary feed={item.feed!} className="py-4 pl-4" testID="discover-feed-card">
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
            <Pressable hitSlop={10} onPress={openFollow} testID="discover-feed-follow-action">
              <View className="px-5 py-2">
                <Text className="text-sm font-bold text-tertiary-label">
                  {t("feed.actions.followed")}
                </Text>
              </View>
            </Pressable>
          ) : (
            <Pressable hitSlop={10} onPress={openFollow} testID="discover-feed-follow-action">
              <View className="rounded-full bg-accent px-5 py-2">
                <Text className="text-sm font-bold text-white">{t("feed.actions.follow")}</Text>
              </View>
            </Pressable>
          )}
        </View>
      </View>
    </FeedSummary>
  )
}

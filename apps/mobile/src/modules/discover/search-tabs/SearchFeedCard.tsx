import { useSubscriptionByFeedId } from "@follow/store/subscription/hooks"
import { formatNumber } from "@follow/utils"
import { View } from "react-native"

import { RelativeDateTime } from "@/src/components/ui/datetime/RelativeDateTime"
import { Text } from "@/src/components/ui/typography/Text"
import { SafeAlertCuteReIcon } from "@/src/icons/safe_alert_cute_re"
import { SafetyCertificateCuteReIcon } from "@/src/icons/safety_certificate_cute_re"
import { User3CuteReIcon } from "@/src/icons/user_3_cute_re"
import type { apiClient } from "@/src/lib/api-fetch"
import { useColor } from "@/src/theme/colors"

import { FeedSummary } from "../FeedSummary"

type SearchResultItem = Awaited<ReturnType<typeof apiClient.discover.$post>>["data"][number]
export const SearchFeedCard = ({ item }: { item: SearchResultItem }) => {
  const isSubscribed = useSubscriptionByFeedId(item.feed?.id ?? "")
  const iconColor = useColor("secondaryLabel")
  return (
    <FeedSummary item={item} className="py-4 pl-4">
      <View className="mt-4 flex-row items-center gap-6">
        <View className="flex-row items-center gap-1.5">
          <User3CuteReIcon width={14} height={14} color={iconColor} />
          <Text className="text-secondary-label text-sm">
            {formatNumber(item.analytics?.subscriptionCount || 0)} followers
          </Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          {item.analytics?.updatesPerWeek ? (
            <>
              <SafetyCertificateCuteReIcon width={14} height={14} color={iconColor} />
              <Text className="text-secondary-label text-sm">
                {item.analytics.updatesPerWeek} entries/week
              </Text>
            </>
          ) : item.analytics?.latestEntryPublishedAt ? (
            <>
              <SafeAlertCuteReIcon width={14} height={14} color={iconColor} />
              <Text className="text-secondary-label text-sm">Updated</Text>
              <RelativeDateTime
                className="text-secondary-label text-sm"
                date={new Date(item.analytics.latestEntryPublishedAt)}
              />
            </>
          ) : null}
        </View>
        <View className="ml-auto mr-4 mt-1">
          {isSubscribed ? (
            <View className="px-5 py-2">
              <Text className="text-tertiary-label text-sm font-bold">Followed</Text>
            </View>
          ) : (
            <View className="bg-accent rounded-full px-5 py-2">
              <Text className="text-sm font-bold text-white">Follow</Text>
            </View>
          )}
        </View>
      </View>
    </FeedSummary>
  )
}

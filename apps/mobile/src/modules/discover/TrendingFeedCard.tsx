import { Text, View } from "react-native"

import { User3CuteReIcon } from "@/src/icons/user_3_cute_re"
import type { apiClient } from "@/src/lib/api-fetch"
import { useSubscriptionByFeedId } from "@/src/store/subscription/hooks"
import { useColor } from "@/src/theme/colors"

import { FeedSummary } from "./FeedSummary"

type SearchResultItem = Awaited<ReturnType<typeof apiClient.discover.$post>>["data"][number]

export const TrendingFeedCard = ({ item }: { item: SearchResultItem }) => {
  const isSubscribed = useSubscriptionByFeedId(item.feed?.id ?? "")
  const iconColor = useColor("text")

  return (
    <FeedSummary item={item} className="pb-3 pl-8 pr-4 pt-5" simple>
      <View className="flex-row items-center justify-between pl-[39]">
        <View className="flex-row items-center gap-1.5 opacity-60">
          <User3CuteReIcon width={14} height={14} color={iconColor} />
          <Text className="text-text text-sm">{item.analytics?.subscriptionCount} followers</Text>
        </View>
        <View>
          {isSubscribed ? (
            <View className="rounded-lg px-3 py-2">
              <Text className="text-gray-2 text-sm font-bold">Followed</Text>
            </View>
          ) : (
            <View className="rounded-lg px-3 py-2">
              <Text className="text-accent text-sm font-bold">Follow</Text>
            </View>
          )}
        </View>
      </View>
    </FeedSummary>
  )
}

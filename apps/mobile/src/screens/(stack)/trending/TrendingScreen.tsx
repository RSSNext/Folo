import { useQuery } from "@tanstack/react-query"
import { Text, View } from "react-native"
import { useColor } from "react-native-uikit-colors"

import { getTrendingAggregates } from "@/src/api/trending"
import { PhUsersBold } from "@/src/components/icons/PhUsersBold"
import {
  NavigationBlurEffectHeaderView,
  SafeNavigationScrollView,
} from "@/src/components/layouts/views/SafeNavigationScrollView"
import { UserAvatar } from "@/src/components/ui/avatar/UserAvatar"
import {
  GroupedInsetListCard,
  GroupedInsetListSectionHeader,
} from "@/src/components/ui/grouped/GroupedList"
import { FallbackIcon } from "@/src/components/ui/icon/fallback-icon"
import { FeedIcon } from "@/src/components/ui/icon/feed-icon"
import { Image } from "@/src/components/ui/image/Image"
import { PlatformActivityIndicator } from "@/src/components/ui/loading/PlatformActivityIndicator"
import { ItemPressable } from "@/src/components/ui/pressable/ItemPressable"
import { openLink } from "@/src/lib/native"
import { useNavigation } from "@/src/lib/navigation/hooks"
import type { NavigationControllerView } from "@/src/lib/navigation/types"

import { FollowScreen } from "../../(modal)/FollowScreen"
import { ProfileScreen } from "../../(modal)/ProfileScreen"

const UserCount = ({ count, className }: { count: number; className?: string }) => {
  const secondaryLabelColor = useColor("secondaryLabel")
  return (
    <View className="flex-row items-center gap-1 opacity-60">
      <PhUsersBold color={secondaryLabelColor} size={12} />
      <Text className={`text-label text-xs tabular-nums ${className}`}>{count}</Text>
    </View>
  )
}

export const TrendingScreen: NavigationControllerView = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["trending"],
    queryFn: () => getTrendingAggregates({ language: "en" }),
  })
  const navigation = useNavigation()

  return (
    <SafeNavigationScrollView Header={<NavigationBlurEffectHeaderView title={"Trending"} />}>
      {isLoading ? (
        <View className="h-36 items-center justify-center">
          <PlatformActivityIndicator />
        </View>
      ) : (
        <>
          {/* Trending Users Section */}
          {data && data.trendingUsers.length > 0 && (
            <View>
              <GroupedInsetListSectionHeader label={"Trending Users"} />
              <GroupedInsetListCard
                SeparatorElement={
                  <View
                    style={{
                      transform: [{ scaleY: 0.5 }],
                    }}
                    className="bg-non-opaque-separator ml-16 h-px"
                    collapsable={false}
                  />
                }
              >
                {/* Remaining Users */}
                {data.trendingUsers.map((user) => (
                  <ItemPressable
                    key={user.id}
                    onPress={() =>
                      navigation.presentControllerView(ProfileScreen, {
                        userId: user.id,
                      })
                    }
                    className="flex-row items-center px-4 py-2.5"
                  >
                    <UserAvatar image={user.image} size={36} />
                    <Text className="text-label ml-3 font-medium">{user.name}</Text>
                  </ItemPressable>
                ))}
              </GroupedInsetListCard>
            </View>
          )}

          {/* Trending Lists Section */}
          {data && data.trendingLists.length > 0 && (
            <View className="mt-6">
              <GroupedInsetListSectionHeader label={"Trending Lists"} />
              <GroupedInsetListCard>
                {data.trendingLists.map((item) => (
                  <ItemPressable
                    key={item.id}
                    onPress={() =>
                      navigation.presentControllerView(FollowScreen, {
                        type: "list",
                        id: item.id,
                      })
                    }
                    className="flex-row items-center px-4 py-3.5"
                  >
                    <View className="ml-1 overflow-hidden rounded">
                      {!!item.image && (
                        <Image
                          proxy={{
                            width: 36,
                            height: 36,
                          }}
                          style={{ height: 36, width: 36 }}
                          source={{ uri: item.image }}
                        />
                      )}
                      {!item.image && <FallbackIcon title={item.title || ""} size={36} />}
                    </View>
                    <View className="ml-3 flex-1">
                      <Text className="text-label text-base font-medium" numberOfLines={1}>
                        {item.title}
                      </Text>
                      {!!item.description && (
                        <Text className="text-secondary-label text-sm" numberOfLines={2}>
                          {item.description}
                        </Text>
                      )}
                      {/* @ts-ignore */}
                      {!!item.subscriberCount && <UserCount count={item.subscriberCount} />}
                    </View>
                  </ItemPressable>
                ))}
              </GroupedInsetListCard>
            </View>
          )}

          {/* Trending Feeds Section */}
          {data && data.trendingFeeds.length > 0 && (
            <View className="mt-6">
              <GroupedInsetListSectionHeader label={"Trending Feeds"} />
              <GroupedInsetListCard>
                {data.trendingFeeds.map((feed) => (
                  <ItemPressable
                    key={feed.id}
                    onPress={() =>
                      navigation.presentControllerView(FollowScreen, {
                        type: "feed",
                        id: feed.id,
                      })
                    }
                    className="flex-row items-center justify-between px-4 py-3"
                  >
                    <View className="flex-1 flex-row items-center">
                      <FeedIcon feed={feed as any} size={24} className="rounded" />
                      <Text className="text-label ml-3 flex-1" numberOfLines={1}>
                        {feed.title}
                      </Text>
                    </View>
                    {!!(feed as any).subscriberCount && (
                      <UserCount count={(feed as any).subscriberCount} />
                    )}
                  </ItemPressable>
                ))}
              </GroupedInsetListCard>
            </View>
          )}

          {/* Trending Entries Section */}
          {data && data.trendingEntries.length > 0 && (
            <View className="mb-8 mt-6">
              <GroupedInsetListSectionHeader label={"Trending Entries"} />
              <GroupedInsetListCard>
                {data.trendingEntries.map((entry) => (
                  <ItemPressable
                    key={entry.id}
                    onPress={() => openLink(entry.url)}
                    className="flex-row items-center justify-between px-4 py-3"
                  >
                    <Text className="text-accent flex-1" numberOfLines={1}>
                      {entry.title}
                    </Text>
                    <View className="flex-row items-center gap-1 opacity-60">
                      <Text className="text-xs">{entry.readCount}</Text>
                    </View>
                  </ItemPressable>
                ))}
              </GroupedInsetListCard>
            </View>
          )}
        </>
      )}
    </SafeNavigationScrollView>
  )
}

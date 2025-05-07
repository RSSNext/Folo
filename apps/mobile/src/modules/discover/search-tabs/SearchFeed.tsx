import { FeedViewType } from "@follow/constants"
import { getBackgroundGradient } from "@follow/utils"
import { useQuery } from "@tanstack/react-query"
import { LinearGradient } from "expo-linear-gradient"
import { useAtomValue } from "jotai"
import { Text, useWindowDimensions, View } from "react-native"
import { ScrollView } from "react-native-gesture-handler"

import { RelativeDateTime } from "@/src/components/ui/datetime/RelativeDateTime"
import { FeedIcon } from "@/src/components/ui/icon/feed-icon"
import { Image } from "@/src/components/ui/image/Image"
import { ItemPressableStyle } from "@/src/components/ui/pressable/enum"
import { ItemPressable } from "@/src/components/ui/pressable/ItemPressable"
import { RightCuteReIcon } from "@/src/icons/right_cute_re"
import { SafeAlertCuteReIcon } from "@/src/icons/safe_alert_cute_re"
import { SafetyCertificateCuteReIcon } from "@/src/icons/safety_certificate_cute_re"
import { User3CuteReIcon } from "@/src/icons/user_3_cute_re"
import { apiClient } from "@/src/lib/api-fetch"
import { useNavigation } from "@/src/lib/navigation/hooks"
import { FollowScreen } from "@/src/screens/(modal)/FollowScreen"
import { useSubscriptionByFeedId } from "@/src/store/subscription/hooks"
import { useColor } from "@/src/theme/colors"

import { useSearchPageContext } from "../ctx"
import { ItemSeparator } from "./__base"
import { useDataSkeleton } from "./hooks"

type SearchResultItem = Awaited<ReturnType<typeof apiClient.discover.$post>>["data"][number]

export const SearchFeed = () => {
  const { searchValueAtom } = useSearchPageContext()
  const searchValue = useAtomValue(searchValueAtom)
  const windowWidth = useWindowDimensions().width

  const { data, isLoading } = useQuery({
    queryKey: ["searchFeed", searchValue],
    queryFn: () => {
      return apiClient.discover.$post({
        json: {
          keyword: searchValue,
          target: "feeds",
        },
      })
    },
    enabled: !!searchValue,
  })

  const skeleton = useDataSkeleton(isLoading, data)
  if (skeleton) return skeleton

  if (data === undefined) return null

  return (
    <View style={{ width: windowWidth }}>
      <Text className="text-text/60 px-6 pt-4">Found {data.data?.length} feeds</Text>
      <View>
        {data.data?.map((item) => (
          <View key={item.feed?.id || Math.random().toString()}>
            <SearchFeedItem item={item} />
            <ItemSeparator />
          </View>
        ))}
      </View>
    </View>
  )
}

const SearchFeedItem = ({ item }: { item: SearchResultItem }) => {
  const isSubscribed = useSubscriptionByFeedId(item.feed?.id ?? "")
  const navigation = useNavigation()
  const iconColor = useColor("text")

  return (
    <ItemPressable
      itemStyle={ItemPressableStyle.Plain}
      className="py-8"
      onPress={() => {
        if (item.feed?.id) {
          navigation.presentControllerView(FollowScreen, {
            id: item.feed.id,
            type: "feed",
          })
        }
      }}
    >
      {/* Headline */}
      <View className="flex-row items-center gap-2 pl-4 pr-2">
        <View className="size-[32px] overflow-hidden rounded-lg">
          <FeedIcon
            size={32}
            feed={
              item.feed
                ? {
                    id: item.feed?.id!,
                    title: item.feed?.title!,
                    url: item.feed?.url!,
                    image: item.feed?.image!,
                    ownerUserId: item.feed?.ownerUserId!,
                    siteUrl: item.feed?.siteUrl!,
                    type: FeedViewType.Articles,
                  }
                : undefined
            }
          />
        </View>
        <View className="flex-1">
          <Text
            className="text-text text-lg font-semibold"
            ellipsizeMode="middle"
            numberOfLines={1}
          >
            {item.feed?.title}
          </Text>
          {!!item.feed?.description && (
            <Text className="text-text/60" ellipsizeMode="tail" numberOfLines={1}>
              {item.feed?.description}
            </Text>
          )}
        </View>
        {/* Subscribe */}
        {isSubscribed ? (
          <View className="ml-auto">
            <View className="bg-gray-5/60 rounded-lg px-3 py-2">
              <Text className="text-gray-2 text-sm font-bold">Followed</Text>
            </View>
          </View>
        ) : (
          <View className="ml-auto">
            <View className="bg-accent rounded-lg px-3 py-2">
              <Text className="text-sm font-bold text-white">Follow</Text>
            </View>
          </View>
        )}
      </View>

      <View className="mt-3 flex-row items-center gap-1 pl-4 opacity-60">
        <RightCuteReIcon width={16} height={16} />
        <Text className="text-text">{item.feed?.url}</Text>
      </View>

      {/* Preview */}
      <View className="mt-3">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="flex flex-row gap-4 pl-4"
        >
          {item.entries?.map((entry) => <PreviewItem entry={entry} key={entry.id} />)}
        </ScrollView>
      </View>
      <View className="mt-4 flex-row items-center gap-6 pl-4 opacity-60">
        <View className="flex-row items-center gap-2">
          <User3CuteReIcon width={16} height={16} color={iconColor} />
          <Text className="text-text">{item.subscriptionCount} followers</Text>
        </View>
        <View className="flex-row items-center gap-2">
          {item.updatesPerWeek ? (
            <>
              <SafetyCertificateCuteReIcon width={16} height={16} color={iconColor} />
              <Text className="text-text">{item.updatesPerWeek} entries/week</Text>
            </>
          ) : item.entries?.[0]?.publishedAt ? (
            <>
              <SafeAlertCuteReIcon width={16} height={16} color={iconColor} />
              <Text className="text-text">Updated</Text>
              <RelativeDateTime
                className="text-text"
                date={new Date(item.entries[0].publishedAt)}
              />
            </>
          ) : null}
        </View>
      </View>
    </ItemPressable>
  )
}

const PreviewItem = ({ entry }: { entry: NonNullable<SearchResultItem["entries"]>[number] }) => {
  const firstMedia = entry.media?.[0]
  const [, , , bgAccent, bgAccentLight] = getBackgroundGradient(
    entry.title || entry.url || "Untitled",
  )

  return (
    <View className="bg-secondary-system-background w-[112] flex-col overflow-hidden rounded-lg">
      {firstMedia ? (
        <Image
          source={{ uri: firstMedia.url }}
          className="w-full"
          placeholder={{
            blurhash: firstMedia.blurhash,
          }}
          aspectRatio={112 / 63}
          proxy={{
            width: 112,
            height: 63,
          }}
        />
      ) : (
        <LinearGradient
          className="flex h-[63] w-[112] items-center justify-center"
          colors={[bgAccentLight!, bgAccent!]}
          locations={[0, 1]}
        >
          <Text className="text-lg font-bold text-white">{entry.title?.[0]}</Text>
        </LinearGradient>
      )}
      <View className="flex flex-1 justify-between p-2">
        <Text className="text-text text-sm" ellipsizeMode="tail" numberOfLines={2}>
          {entry.title}
        </Text>
        <RelativeDateTime className="text-text/60 text-sm" date={new Date(entry.publishedAt)} />
      </View>
    </View>
  )
}

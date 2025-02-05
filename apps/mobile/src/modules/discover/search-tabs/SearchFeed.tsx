import { FeedViewType } from "@follow/constants"
import { useQuery } from "@tanstack/react-query"
import { Image } from "expo-image"
import { router } from "expo-router"
import { useAtomValue } from "jotai"
import type { FC } from "react"
import type { ListRenderItem, ListRenderItemInfo } from "react-native"
import { Text, useWindowDimensions, View } from "react-native"
import { ScrollView } from "react-native-gesture-handler"
import Animated, { FadeInUp } from "react-native-reanimated"

import { FeedIcon } from "@/src/components/ui/icon/feed-icon"
import { ItemPressable } from "@/src/components/ui/pressable/item-pressable"
import { apiClient } from "@/src/lib/api-fetch"
import { useSubscriptionByFeedId } from "@/src/store/subscription/hooks"

import { useSearchPageContext } from "../ctx"
import { BaseSearchPageFlatList, ItemSeparator, RenderScrollComponent } from "./__base"
import { useDataSkeleton } from "./hooks"

type SearchResultItem = Awaited<ReturnType<typeof apiClient.discover.$post>>["data"][number]

export const SearchFeed = () => {
  const { searchValueAtom } = useSearchPageContext()
  const searchValue = useAtomValue(searchValueAtom)

  const { data, isLoading, refetch } = useQuery({
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
    <BaseSearchPageFlatList
      refreshing={isLoading}
      onRefresh={refetch}
      keyExtractor={keyExtractor}
      renderScrollComponent={RenderScrollComponent}
      data={data?.data}
      renderItem={renderItem}
      ItemSeparatorComponent={ItemSeparator}
    />
  )
}
const keyExtractor = (item: SearchResultItem) => {
  return item.feed?.id || Math.random().toString()
}

const renderItem: ListRenderItem<SearchResultItem> = (props) => (
  <SearchFeedItem key={props.item.feed?.id} {...props} />
)

const SearchFeedItem: FC<ListRenderItemInfo<SearchResultItem>> = ({ item }) => {
  const isSubscribed = useSubscriptionByFeedId(item.feed?.id ?? "")
  return (
    <Animated.View entering={FadeInUp}>
      <ItemPressable
        className="py-4"
        onPress={() => {
          if (item.feed?.id) {
            router.push(`/follow?id=${item.feed.id}`)
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
          {isSubscribed && (
            <View className="ml-auto">
              <View className="bg-gray-5/60 rounded-full px-2 py-1">
                <Text className="text-gray-2 text-sm font-medium">Subscribed</Text>
              </View>
            </View>
          )}
        </View>

        {/* Preview */}
        <View className="mt-3">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="flex flex-row gap-4 pl-14 pr-2"
          >
            {item.entries?.map((entry) => <PreviewItem entry={entry} key={entry.id} />)}
          </ScrollView>
        </View>
      </ItemPressable>
    </Animated.View>
  )
}
const formatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
})
const PreviewItem = ({ entry }: { entry: NonNullable<SearchResultItem["entries"]>[number] }) => {
  const { width } = useWindowDimensions()
  const firstMedia = entry.media?.[0]

  return (
    <View
      className="border-gray-5 bg-system-background h-[68px] flex-row rounded-lg border p-2"
      style={{ width: (width / 4) * 3 }}
    >
      {/* Left */}
      <View className="flex-1">
        <Text className="text-text" ellipsizeMode="tail" numberOfLines={2}>
          {entry.title}
        </Text>
        <Text className="text-text/60 text-sm" ellipsizeMode="tail" numberOfLines={1}>
          {formatter.format(new Date(entry.publishedAt))}
        </Text>
      </View>

      {/* Right */}
      {!!firstMedia && (
        <View className="bg-gray-6 ml-auto size-[52px] shrink-0 overflow-hidden rounded-lg">
          <Image
            source={firstMedia.url}
            className="size-full rounded-lg"
            contentFit="cover"
            transition={300}
            placeholder={{
              blurHash: firstMedia.blurhash,
            }}
          />
        </View>
      )}
    </View>
  )
}

import { useQuery } from "@tanstack/react-query"
import { useAtomValue } from "jotai"
import { memo } from "react"
import { Text, View } from "react-native"

import { FallbackIcon } from "@/src/components/ui/icon/fallback-icon"
import { Image } from "@/src/components/ui/image/Image"
import { ItemPressableStyle } from "@/src/components/ui/pressable/enum"
import { ItemPressable } from "@/src/components/ui/pressable/ItemPressable"
import { apiClient } from "@/src/lib/api-fetch"
import { useNavigation } from "@/src/lib/navigation/hooks"
import { FollowScreen } from "@/src/screens/(modal)/FollowScreen"
import { useSubscriptionByListId } from "@/src/store/subscription/hooks"

import { useSearchPageContext } from "../ctx"
import { BaseSearchPageFlatList, ItemSeparator, RenderScrollComponent } from "./__base"
import { useDataSkeleton } from "./hooks"

type SearchResultItem = Awaited<ReturnType<typeof apiClient.discover.$post>>["data"][number]

export const SearchList = () => {
  const { searchValueAtom } = useSearchPageContext()
  const searchValue = useAtomValue(searchValueAtom)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["searchList", searchValue],
    queryFn: () => {
      return apiClient.discover.$post({
        json: {
          keyword: searchValue,
          target: "lists",
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

const keyExtractor = (item: SearchResultItem) => item.list?.id ?? Math.random().toString()

const renderItem = ({ item }: { item: SearchResultItem }) => (
  <SearchListCard key={item.list?.id} item={item} />
)

const SearchListCard = memo(({ item }: { item: SearchResultItem }) => {
  const isSubscribed = useSubscriptionByListId(item.list?.id ?? "")
  const navigation = useNavigation()
  return (
    <ItemPressable
      itemStyle={ItemPressableStyle.Plain}
      className="py-2"
      onPress={() => {
        if (item.list?.id) {
          navigation.presentControllerView(FollowScreen, {
            id: item.list.id,
            type: "list",
          })
        }
      }}
    >
      {/* Headline */}
      <View className="flex-row items-center gap-2 pl-4 pr-2">
        <View className="size-[32px] overflow-hidden rounded-lg">
          {item.list?.image ? (
            <Image source={{ uri: item.list.image }} className="size-full" contentFit="cover" />
          ) : (
            !!item.list?.title && <FallbackIcon title={item.list.title} size={32} />
          )}
        </View>
        <View className="flex-1">
          <Text
            className="text-text text-lg font-semibold"
            ellipsizeMode="middle"
            numberOfLines={1}
          >
            {item.list?.title}
          </Text>
          {!!item.list?.description && (
            <Text className="text-text/60" ellipsizeMode="tail" numberOfLines={1}>
              {item.list?.description}
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
    </ItemPressable>
  )
})

import { useSubscriptionByListId } from "@follow/store/subscription/hooks"
import { formatNumber } from "@follow/utils"
import { useQuery } from "@tanstack/react-query"
import { useAtomValue } from "jotai"
import { memo } from "react"
import { Text, useWindowDimensions, View } from "react-native"

import { FallbackIcon } from "@/src/components/ui/icon/fallback-icon"
import { Image } from "@/src/components/ui/image/Image"
import { ItemPressableStyle } from "@/src/components/ui/pressable/enum"
import { ItemPressable } from "@/src/components/ui/pressable/ItemPressable"
import { RightCuteReIcon } from "@/src/icons/right_cute_re"
import { User3CuteReIcon } from "@/src/icons/user_3_cute_re"
import { apiClient } from "@/src/lib/api-fetch"
import { useNavigation } from "@/src/lib/navigation/hooks"
import { UrlBuilder } from "@/src/lib/url-builder"
import { FollowScreen } from "@/src/screens/(modal)/FollowScreen"
import { useColor } from "@/src/theme/colors"

import { useSearchPageContext } from "../ctx"
import { ItemSeparator } from "./__base"
import { useDataSkeleton } from "./hooks"

type SearchResultItem = Awaited<ReturnType<typeof apiClient.discover.$post>>["data"][number]

export const SearchList = () => {
  const { searchValueAtom } = useSearchPageContext()
  const searchValue = useAtomValue(searchValueAtom)
  const windowWidth = useWindowDimensions().width

  const { data, isLoading } = useQuery({
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
    <View style={{ width: windowWidth }}>
      <Text className="text-text/60 px-6 pt-4">Found {data.data?.length} lists</Text>
      <View>
        {data.data?.map((item) => (
          <View key={item.feed?.id || Math.random().toString()}>
            <SearchListCard item={item} />
            <ItemSeparator />
          </View>
        ))}
      </View>
    </View>
  )
}

const SearchListCard = memo(({ item }: { item: SearchResultItem }) => {
  const isSubscribed = useSubscriptionByListId(item.list?.id ?? "")
  const navigation = useNavigation()
  const iconColor = useColor("text")

  return (
    <ItemPressable
      itemStyle={ItemPressableStyle.Plain}
      className="py-8"
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
        <Text className="text-text text-sm">{UrlBuilder.shareList(item.list?.id ?? "")}</Text>
      </View>

      <View className="mt-4 flex-row items-center gap-6 pl-4 opacity-60">
        <View className="flex-row items-center gap-2">
          <User3CuteReIcon width={16} height={16} color={iconColor} />
          <Text className="text-text">
            {formatNumber(item.analytics?.subscriptionCount || 0)} followers
          </Text>
        </View>
      </View>
    </ItemPressable>
  )
})

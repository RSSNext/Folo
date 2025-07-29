import { FeedViewType } from "@follow/constants"
import { getBackgroundGradient } from "@follow/utils"
import { LinearGradient } from "expo-linear-gradient"
import { View } from "react-native"
import { ScrollView } from "react-native-gesture-handler"

import { RelativeDateTime } from "@/src/components/ui/datetime/RelativeDateTime"
import { FeedIcon } from "@/src/components/ui/icon/feed-icon"
import { Image } from "@/src/components/ui/image/Image"
import { ItemPressableStyle } from "@/src/components/ui/pressable/enum"
import { ItemPressable } from "@/src/components/ui/pressable/ItemPressable"
import { Text } from "@/src/components/ui/typography/Text"
import type { apiClient } from "@/src/lib/api-fetch"
import { useNavigation } from "@/src/lib/navigation/hooks"
import { FollowScreen } from "@/src/screens/(modal)/FollowScreen"
import { FeedScreen } from "@/src/screens/(stack)/feeds/[feedId]/FeedScreen"

import { selectFeed, selectTimeline } from "../screen/atoms"

type SearchResultItem = Awaited<ReturnType<typeof apiClient.discover.$post>>["data"][number]
export const FeedSummary = ({
  item,
  children,
  preChildren,
  className,
  simple,
  view,
  preview,
}: {
  item: SearchResultItem
  children?: React.ReactNode
  preChildren?: React.ReactNode
  className?: string
  simple?: boolean
  view?: number | null
  preview?: boolean
}) => {
  const navigation = useNavigation()
  return (
    <ItemPressable
      itemStyle={ItemPressableStyle.UnStyled}
      onPress={() => {
        if (item.feed?.id) {
          if (preview) {
            if (typeof view === "number") {
              selectTimeline({
                type: "view",
                viewId: view,
              })
            }

            selectFeed({
              type: "feed",
              feedId: item.feed.id,
            })
            navigation.pushControllerView(FeedScreen, {
              feedId: item.feed?.id,
            })
          } else {
            navigation.presentControllerView(FollowScreen, {
              id: item.feed.id,
              type: "feed",
            })
          }
        } else if (item.feed?.url) {
          navigation.presentControllerView(FollowScreen, {
            url: item.feed.url,
            type: "url",
          })
        }
      }}
      className={className}
    >
      {preChildren}
      {/* Headline */}
      <View className="flex-1 flex-row items-center gap-2 pr-2">
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
          <Text className="text-text text-lg font-semibold" numberOfLines={1}>
            {item.feed?.title}
          </Text>
          <Text className="text-text text-sm leading-tight opacity-60" numberOfLines={1}>
            {item.feed?.url}
          </Text>
        </View>
      </View>
      {!simple && !!item.feed?.description && (
        <Text
          className="text-text mt-3 pl-[39] pr-2 text-sm"
          ellipsizeMode="tail"
          numberOfLines={2}
        >
          {item.feed?.description}
        </Text>
      )}
      {!simple && !!item.entries && (
        <View className="mt-4">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="flex flex-row gap-4"
          >
            {item.entries?.map((entry) => (
              <PreviewItem entry={entry} key={entry.id || entry.guid} />
            ))}
          </ScrollView>
        </View>
      )}
      {children}
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
          source={{
            uri: firstMedia.url,
          }}
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

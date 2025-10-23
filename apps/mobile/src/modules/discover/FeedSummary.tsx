import { FeedViewType } from "@follow/constants"
import { View } from "react-native"

import { FeedIcon } from "@/src/components/ui/icon/feed-icon"
import { ItemPressableStyle } from "@/src/components/ui/pressable/enum"
import { ItemPressable } from "@/src/components/ui/pressable/ItemPressable"
import { Text } from "@/src/components/ui/typography/Text"
import { useNavigation } from "@/src/lib/navigation/hooks"
import { FollowScreen } from "@/src/screens/(modal)/FollowScreen"
import { FeedScreen } from "@/src/screens/(stack)/feeds/[feedId]/FeedScreen"

import { selectFeed, selectTimeline } from "../screen/atoms"

type FeedSummaryFeed = {
  id: string
  title?: Nullable<string>
  url?: Nullable<string>
  image?: Nullable<string>
  ownerUserId?: Nullable<string>
  siteUrl?: Nullable<string>
  description?: Nullable<string>

  [key: string]: any
}

export const FeedSummary = ({
  feed,
  children,
  preChildren,
  className,
  simple,
  view,
  preview,
}: {
  feed: FeedSummaryFeed
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
        if (feed?.id) {
          if (preview) {
            if (typeof view === "number") {
              selectTimeline({
                type: "view",
                viewId: view,
              })
            }

            selectFeed({
              type: "feed",
              feedId: feed.id,
            })
            navigation.pushControllerView(FeedScreen, {
              feedId: feed.id,
            })
          } else {
            navigation.presentControllerView(FollowScreen, {
              id: feed.id,
              type: "feed",
            })
          }
        } else if (feed.url) {
          navigation.presentControllerView(FollowScreen, {
            url: feed.url,
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
              feed
                ? {
                    id: feed.id!,
                    title: feed.title!,
                    url: feed.url!,
                    image: feed.image!,
                    ownerUserId: feed.ownerUserId!,
                    siteUrl: feed.siteUrl!,
                    type: FeedViewType.Articles,
                  }
                : undefined
            }
          />
        </View>
        <View className="flex-1">
          <Text className="text-lg font-semibold text-text" numberOfLines={1}>
            {feed.title}
          </Text>
          <Text className="text-sm leading-tight text-text opacity-60" numberOfLines={1}>
            {feed.url}
          </Text>
        </View>
      </View>
      {!simple && !!feed.description && (
        <Text
          className="mt-3 pl-[39] pr-2 text-sm text-text"
          ellipsizeMode="tail"
          numberOfLines={2}
        >
          {feed.description}
        </Text>
      )}

      {children}
    </ItemPressable>
  )
}

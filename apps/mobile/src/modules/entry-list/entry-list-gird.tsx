import { FeedViewType } from "@follow/constants"
import { useTypeScriptHappyCallback } from "@follow/hooks"
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs"
import { useHeaderHeight } from "@react-navigation/elements"
import type { MasonryFlashListProps } from "@shopify/flash-list"
import { MasonryFlashList } from "@shopify/flash-list"
import { Image } from "expo-image"
import { Link } from "expo-router"
import { useContext } from "react"
import { Pressable, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { NavigationContext } from "@/src/components/common/SafeNavigationScrollView"
import { ThemedText } from "@/src/components/common/ThemedText"
import { ItemPressable } from "@/src/components/ui/pressable/item-pressable"
import { useEntry } from "@/src/store/entry/hooks"

import { useSelectedFeed } from "../feed-drawer/atoms"

export function EntryListContentGrid({
  entryIds,
  ...rest
}: {
  entryIds: string[]
} & Omit<MasonryFlashListProps<string>, "data" | "renderItem">) {
  const insets = useSafeAreaInsets()
  const tabBarHeight = useBottomTabBarHeight()
  const headerHeight = useHeaderHeight()
  const { scrollY } = useContext(NavigationContext)!
  return (
    <MasonryFlashList
      data={entryIds}
      renderItem={useTypeScriptHappyCallback(({ item }) => {
        return <RenderEntryItem id={item} />
      }, [])}
      numColumns={2}
      onScroll={useTypeScriptHappyCallback(
        (e) => {
          scrollY.setValue(e.nativeEvent.contentOffset.y)
        },
        [scrollY],
      )}
      scrollIndicatorInsets={{
        top: headerHeight - insets.top,
        bottom: tabBarHeight - insets.bottom,
      }}
      estimatedItemSize={100}
      contentContainerStyle={{
        paddingTop: headerHeight,
        paddingBottom: tabBarHeight,
      }}
      {...rest}
    />
  )
}

function RenderEntryItem({ id }: { id: string }) {
  const selectedFeed = useSelectedFeed()
  const view = selectedFeed.type === "view" ? selectedFeed.viewId : null
  const item = useEntry(id)
  if (!item) {
    return null
  }
  const photo = item.media?.find((media) => media.type === "photo")
  const video = item.media?.find((media) => media.type === "video")
  const imageUrl = photo?.url || video?.preview_image_url
  const blurhash = photo?.blurhash || video?.blurhash
  const aspectRatio =
    view === FeedViewType.Pictures && photo?.height && photo.width
      ? photo.width / photo.height
      : 16 / 9

  return (
    <ItemPressable className="m-1 overflow-hidden rounded-md">
      <Link href={`/entries/${item.id}`} asChild>
        <Pressable>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              placeholder={{
                blurhash,
              }}
              style={{
                width: "100%",
                aspectRatio,
              }}
              placeholderContentFit="cover"
              recyclingKey={imageUrl}
            />
          ) : (
            <View className="aspect-video w-full items-center justify-center">
              <ThemedText className="text-center">No media available</ThemedText>
            </View>
          )}
        </Pressable>
      </Link>

      <ThemedText className="p-2">{item.title}</ThemedText>
    </ItemPressable>
  )
}

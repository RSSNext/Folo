import { FeedViewType } from "@follow/constants"
import { useTypeScriptHappyCallback } from "@follow/hooks"
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs"
import { FlashList } from "@shopify/flash-list"
import { Image } from "expo-image"
import { router } from "expo-router"
import { useCallback, useContext, useMemo } from "react"
import { StyleSheet, Text, useAnimatedValue, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import {
  NavigationBlurEffectHeader,
  NavigationContext,
} from "@/src/components/common/SafeNavigationScrollView"
import { ItemPressable } from "@/src/components/ui/pressable/item-pressable"
import { useDefaultHeaderHeight } from "@/src/hooks/useDefaultHeaderHeight"
import { useSelectedFeed, useSelectedFeedTitle } from "@/src/modules/feed-drawer/atoms"
import { useEntry } from "@/src/store/entry/hooks"

import { ViewSelector } from "../feed-drawer/view-selector"
import { LeftAction, RightAction } from "./action"
import { EntryListContentGrid } from "./entry-list-gird"

const headerHideableBottomHeight = 58

export function EntryListScreen({ entryIds }: { entryIds: string[] }) {
  const scrollY = useAnimatedValue(0)
  const selectedFeed = useSelectedFeed()
  const view = selectedFeed.type === "view" ? selectedFeed.viewId : null
  const viewTitle = useSelectedFeedTitle()

  return (
    <NavigationContext.Provider value={useMemo(() => ({ scrollY }), [scrollY])}>
      <NavigationBlurEffectHeader
        headerShown
        headerTitle={viewTitle}
        headerLeft={useCallback(
          () => (
            <LeftAction />
          ),
          [],
        )}
        headerRight={useCallback(
          () => (
            <RightAction />
          ),
          [],
        )}
        headerHideableBottomHeight={headerHideableBottomHeight}
        headerHideableBottom={ViewSelector}
      />
      {view === FeedViewType.Pictures || view === FeedViewType.Videos ? (
        <EntryListContentGrid entryIds={entryIds} />
      ) : (
        <EntryListContent entryIds={entryIds} />
      )}
    </NavigationContext.Provider>
  )
}

function EntryListContent({ entryIds }: { entryIds: string[] }) {
  const insets = useSafeAreaInsets()
  const tabBarHeight = useBottomTabBarHeight()
  const originalDefaultHeaderHeight = useDefaultHeaderHeight()
  const headerHeight = originalDefaultHeaderHeight + headerHideableBottomHeight
  const { scrollY } = useContext(NavigationContext)!
  return (
    <FlashList
      onScroll={useTypeScriptHappyCallback(
        (e) => {
          scrollY.setValue(e.nativeEvent.contentOffset.y)
        },
        [scrollY],
      )}
      data={entryIds}
      renderItem={useTypeScriptHappyCallback(
        ({ item: id }) => (
          <EntryItem key={id} entryId={id} />
        ),
        [],
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
      ItemSeparatorComponent={ItemSeparator}
    />
  )
}

const ItemSeparator = () => {
  return (
    <View
      className="bg-opaque-separator mx-4"
      style={{
        height: StyleSheet.hairlineWidth,
      }}
    />
  )
}

function EntryItem({ entryId }: { entryId: string }) {
  const entry = useEntry(entryId)

  const handlePress = useCallback(() => {
    router.push(`/entries/${entryId}`)
  }, [entryId])

  if (!entry) return <EntryItemSkeleton />
  const { title, description, publishedAt, media } = entry
  const image = media?.[0]?.url
  const blurhash = media?.[0]?.blurhash

  return (
    <ItemPressable className="flex flex-row items-center p-4" onPress={handlePress}>
      <View className="flex-1 space-y-2">
        <Text numberOfLines={2} className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          {title}
        </Text>
        <Text className="line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">{description}</Text>
        <Text className="text-xs text-zinc-500 dark:text-zinc-500">
          {publishedAt.toLocaleString()}
        </Text>
      </View>
      {image && (
        <Image
          source={{ uri: image }}
          placeholder={{ blurhash }}
          className="ml-2 size-20 rounded-md bg-zinc-200 dark:bg-zinc-800"
          contentFit="cover"
        />
      )}
    </ItemPressable>
  )
}

function EntryItemSkeleton() {
  return (
    <View className="bg-secondary-system-grouped-background flex flex-row items-center p-4">
      <View className="flex flex-1 flex-col justify-between">
        {/* Title skeleton */}
        <View className="h-6 w-3/4 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
        {/* Description skeleton */}
        <View className="mt-2 w-full flex-1 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
      </View>

      {/* Image skeleton */}
      <View className="ml-2 size-20 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
    </View>
  )
}

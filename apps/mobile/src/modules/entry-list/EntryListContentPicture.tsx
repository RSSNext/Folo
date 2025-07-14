import { useTypeScriptHappyCallback } from "@follow/hooks"
import { usePrefetchEntryTranslation } from "@follow/store/translation/hooks"
import type { MasonryFlashListProps } from "@shopify/flash-list"
import type { ElementRef } from "react"
import { useImperativeHandle } from "react"
import { StyleSheet, View } from "react-native"

import { useActionLanguage, useGeneralSettingKey } from "@/src/atoms/settings/general"
import { useBottomTabBarHeight } from "@/src/components/layouts/tabbar/hooks"
import { PlatformActivityIndicator } from "@/src/components/ui/loading/PlatformActivityIndicator"
import { checkLanguage } from "@/src/lib/translation"
import { useEntries } from "@/src/modules/screen/atoms"
import { useHeaderHeight } from "@/src/modules/screen/hooks/useHeaderHeight"

import { TimelineSelectorMasonryList } from "../screen/TimelineSelectorList"
import { GridEntryListFooter } from "./EntryListFooter"
import { useOnViewableItemsChanged, usePagerListPerformanceHack } from "./hooks"
// import type { MasonryItem } from "./templates/EntryGridItem"
import { EntryPictureItem } from "./templates/EntryPictureItem"

export const EntryListContentPicture = ({
  ref: forwardRef,
  entryIds,
  active,
  ...rest
}: { entryIds: string[] | null; active?: boolean } & Omit<
  MasonryFlashListProps<string>,
  "data" | "renderItem"
> & { ref?: React.Ref<ElementRef<typeof TimelineSelectorMasonryList> | null> }) => {
  const { onScroll: hackOnScroll, ref, style: hackStyle } = usePagerListPerformanceHack()
  useImperativeHandle(forwardRef, () => ref.current!)
  const { fetchNextPage, refetch, isRefetching, hasNextPage, isFetching, isReady } = useEntries()
  const { onViewableItemsChanged, onScroll, viewableItems } = useOnViewableItemsChanged({
    disabled: active === false || isFetching,
    onScroll: hackOnScroll,
  })
  const translation = useGeneralSettingKey("translation")
  const actionLanguage = useActionLanguage()
  usePrefetchEntryTranslation({
    entryIds: active ? viewableItems.map((item) => item.key) : [],
    language: actionLanguage,
    checkLanguage,
    translation,
  })

  const renderItem = useTypeScriptHappyCallback(({ item }: { item: string }) => {
    return <EntryPictureItem id={item} />
  }, [])

  const headerHeight = useHeaderHeight()
  const tabBarHeight = useBottomTabBarHeight()

  // Show loading skeleton when entries are not ready and no data yet
  if (!isReady && (!entryIds || entryIds.length === 0)) {
    return (
      <View
        className="flex-1 px-2"
        style={{ paddingTop: headerHeight, paddingBottom: tabBarHeight }}
      >
        <View className="flex-row">
          <View className="mr-1 flex-1">
            {Array.from({ length: 4 }).map((_, index) => (
              <EntryPictureItemSkeleton key={`left-${index}`} />
            ))}
          </View>
          <View className="ml-1 flex-1">
            {Array.from({ length: 4 }).map((_, index) => (
              <EntryPictureItemSkeleton key={`right-${index}`} />
            ))}
          </View>
        </View>
      </View>
    )
  }

  return (
    <TimelineSelectorMasonryList
      ref={ref}
      isRefetching={isRefetching}
      data={entryIds}
      renderItem={renderItem}
      keyExtractor={defaultKeyExtractor}
      onViewableItemsChanged={onViewableItemsChanged}
      onScroll={onScroll}
      onEndReached={fetchNextPage}
      numColumns={2}
      style={hackStyle}
      estimatedItemSize={100}
      contentContainerStyle={styles.contentContainer}
      ListFooterComponent={
        hasNextPage ? (
          <View className="h-20 items-center justify-center">
            <PlatformActivityIndicator />
          </View>
        ) : (
          <GridEntryListFooter />
        )
      }
      {...rest}
      onRefresh={refetch}
    />
  )
}

function EntryPictureItemSkeleton() {
  const heights = [120, 160, 140, 180, 100, 200] // Different heights for variety
  const randomHeight = heights[Math.floor(Math.random() * heights.length)]

  return (
    <View className="mx-1 mb-2">
      {/* Image placeholder */}
      <View className="bg-system-fill animate-pulse rounded-md" style={{ height: randomHeight }} />

      {/* Footer content */}
      <View className="gap-2 px-1 py-2">
        {/* Title lines */}
        <View className="gap-1">
          <View className="bg-system-fill h-3 animate-pulse rounded-md" style={{ width: "90%" }} />
          <View className="bg-system-fill h-3 animate-pulse rounded-md" style={{ width: "70%" }} />
        </View>

        {/* Feed info */}
        <View className="flex-row items-center gap-1.5">
          <View className="bg-system-fill size-3.5 animate-pulse rounded-full" />
          <View className="bg-system-fill h-3 animate-pulse rounded-md" style={{ width: "40%" }} />
          <View className="bg-system-fill h-3 animate-pulse rounded-md" style={{ width: "30%" }} />
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingHorizontal: 8,
  },
})

const defaultKeyExtractor = (item: string) => {
  return item
}

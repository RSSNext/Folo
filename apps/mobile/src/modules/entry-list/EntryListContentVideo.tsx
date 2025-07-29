import { useTypeScriptHappyCallback } from "@follow/hooks"
import { usePrefetchEntryTranslation } from "@follow/store/translation/hooks"
import type { FlashList, MasonryFlashListProps } from "@shopify/flash-list"
import type { ElementRef } from "react"
import { useImperativeHandle, useMemo, useRef } from "react"
import { StyleSheet, View } from "react-native"

import { useActionLanguage, useGeneralSettingKey } from "@/src/atoms/settings/general"
import { useBottomTabBarHeight } from "@/src/components/layouts/tabbar/hooks"
import { checkLanguage } from "@/src/lib/translation"
import { useEntries } from "@/src/modules/screen/atoms"
import { useHeaderHeight } from "@/src/modules/screen/hooks/useHeaderHeight"

import { TimelineSelectorMasonryList } from "../screen/TimelineSelectorList"
import { GridEntryListFooter } from "./EntryListFooter"
import { useOnViewableItemsChanged } from "./hooks"
import { EntryVideoItem } from "./templates/EntryVideoItem"

export const EntryListContentVideo = ({
  ref: forwardRef,
  entryIds,
  active,
  ...rest
}: { entryIds: string[] | null; active?: boolean } & Omit<
  MasonryFlashListProps<string>,
  "data" | "renderItem"
> & { ref?: React.Ref<ElementRef<typeof TimelineSelectorMasonryList> | null> }) => {
  const ref = useRef<FlashList<any>>(null)
  useImperativeHandle(forwardRef, () => ref.current!)
  const { fetchNextPage, refetch, isRefetching, isFetching, hasNextPage, isReady } = useEntries()
  const { onViewableItemsChanged, onScroll, viewableItems } = useOnViewableItemsChanged({
    disabled: active === false || isFetching,
  })

  const translation = useGeneralSettingKey("translation")
  const actionLanguage = useActionLanguage()
  usePrefetchEntryTranslation({
    entryIds: active ? viewableItems.map((item) => item.key) : [],
    language: actionLanguage,
    setting: translation,
    checkLanguage,
  })

  const ListFooterComponent = useMemo(
    () =>
      hasNextPage ? (
        <View className="flex flex-row justify-between">
          <EntryItemSkeleton />
          <EntryItemSkeleton />
        </View>
      ) : (
        <GridEntryListFooter />
      ),
    [hasNextPage],
  )

  const renderItem = useTypeScriptHappyCallback(({ item }: { item: string }) => {
    return <EntryVideoItem id={item} />
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
            {Array.from({ length: 3 }).map((_, index) => (
              <EntryVideoItemSkeleton key={`left-${index}`} />
            ))}
          </View>
          <View className="ml-1 flex-1">
            {Array.from({ length: 3 }).map((_, index) => (
              <EntryVideoItemSkeleton key={`right-${index}`} />
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
      estimatedItemSize={100}
      ListFooterComponent={ListFooterComponent}
      {...rest}
      onRefresh={refetch}
      contentContainerStyle={styles.contentContainer}
    />
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

function EntryVideoItemSkeleton() {
  return (
    <View className="m-1 overflow-hidden rounded-md">
      {/* Video thumbnail */}
      <View
        className="bg-system-fill h-32 w-full animate-pulse rounded-md"
        style={{ aspectRatio: 16 / 9 }}
      />

      {/* Description and footer */}
      <View className="my-2 px-2">
        {/* Description */}
        <View className="bg-system-fill mb-1 h-4 w-full animate-pulse rounded-md" />
        <View className="bg-system-fill mb-3 h-4 w-3/4 animate-pulse rounded-md" />

        {/* Footer with feed icon and metadata */}
        <View className="flex-row items-center gap-1">
          <View className="bg-system-fill size-4 animate-pulse rounded-full" />
          <View className="bg-system-fill h-3 w-24 animate-pulse rounded-md" />
          <View className="bg-system-fill h-3 w-20 animate-pulse rounded-md" />
        </View>
      </View>
    </View>
  )
}

export function EntryItemSkeleton() {
  return (
    <View className="m-1 overflow-hidden rounded-md">
      {/* Video thumbnail */}
      <View
        className="bg-system-fill h-32 w-full animate-pulse rounded-md"
        style={{ aspectRatio: 16 / 9 }}
      />

      {/* Description and footer */}
      <View className="my-2 px-2">
        {/* Description */}
        <View className="bg-system-fill mb-1 h-4 w-full animate-pulse rounded-md" />
        <View className="bg-system-fill mb-3 h-4 w-3/4 animate-pulse rounded-md" />

        {/* Footer with feed icon and metadata */}
        <View className="flex-row items-center gap-1">
          <View className="bg-system-fill size-4 animate-pulse rounded-full" />
          <View className="bg-system-fill h-3 w-24 animate-pulse rounded-md" />
          <View className="bg-system-fill h-3 w-20 animate-pulse rounded-md" />
        </View>
      </View>
    </View>
  )
}

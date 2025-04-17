import { useTypeScriptHappyCallback } from "@follow/hooks"
import type { MasonryFlashListProps } from "@shopify/flash-list"
import type { ElementRef } from "react"
import { forwardRef, useImperativeHandle, useMemo } from "react"
import { View } from "react-native"

import { useFetchEntriesControls } from "@/src/modules/screen/atoms"
import { usePrefetchEntryTranslation } from "@/src/store/translation/hooks"

import { TimelineSelectorMasonryList } from "../screen/TimelineSelectorList"
import { GridEntryListFooter } from "./EntryListFooter"
import { useOnViewableItemsChanged, usePagerListPerformanceHack } from "./hooks"
import { EntryVideoItem } from "./templates/EntryVideoItem"

export const EntryListContentVideo = forwardRef<
  ElementRef<typeof TimelineSelectorMasonryList>,
  { entryIds: string[] | null; active?: boolean } & Omit<
    MasonryFlashListProps<string>,
    "data" | "renderItem"
  >
>(({ entryIds, active, ...rest }, forwardRef) => {
  const { onScroll: hackOnScroll, ref, style: hackStyle } = usePagerListPerformanceHack()
  useImperativeHandle(forwardRef, () => ref.current!)
  const { fetchNextPage, refetch, isRefetching, isFetching, hasNextPage } =
    useFetchEntriesControls()
  const { onViewableItemsChanged, onScroll, viewableItems } = useOnViewableItemsChanged({
    disabled: active === false || isFetching,
    onScroll: hackOnScroll,
  })

  usePrefetchEntryTranslation({ entryIds: active ? viewableItems.map((item) => item.key) : [] })

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

  return (
    <TimelineSelectorMasonryList
      ref={ref}
      isRefetching={isRefetching}
      data={entryIds}
      renderItem={useTypeScriptHappyCallback(({ item }: { item: string }) => {
        return <EntryVideoItem id={item} />
      }, [])}
      keyExtractor={defaultKeyExtractor}
      onViewableItemsChanged={onViewableItemsChanged}
      onScroll={onScroll}
      onEndReached={fetchNextPage}
      numColumns={2}
      estimatedItemSize={100}
      ListFooterComponent={ListFooterComponent}
      {...rest}
      onRefresh={refetch}
      style={hackStyle}
    />
  )
})

const defaultKeyExtractor = (item: string) => {
  return item
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

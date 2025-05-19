import type { FeedViewType } from "@follow/constants"
import type { ListRenderItemInfo } from "@shopify/flash-list"
import type { ElementRef } from "react"
import { useCallback, useImperativeHandle, useMemo } from "react"
import { View } from "react-native"

import { usePlayingUrl } from "@/src/lib/player"
import { usePrefetchEntryTranslation } from "@/src/store/translation/hooks"

import { useFetchEntriesControls } from "../screen/atoms"
import { TimelineSelectorList } from "../screen/TimelineSelectorList"
import { EntryListFooter } from "./EntryListFooter"
import { useOnViewableItemsChanged, usePagerListPerformanceHack } from "./hooks"
import { ItemSeparator } from "./ItemSeparator"
import { EntryNormalItem } from "./templates/EntryNormalItem"
import type { EntryExtraData } from "./types"

export const EntryListContentArticle = ({
  ref: forwardRef,
  entryIds,
  active,
  view,
}: { entryIds: string[] | null; active?: boolean; view: FeedViewType } & {
  ref?: React.Ref<ElementRef<typeof TimelineSelectorList> | null>
}) => {
  const playingAudioUrl = usePlayingUrl()
  const extraData: EntryExtraData = useMemo(
    () => ({ playingAudioUrl, entryIds }),
    [playingAudioUrl, entryIds],
  )

  const { fetchNextPage, isFetching, refetch, isRefetching, hasNextPage } =
    useFetchEntriesControls()

  const renderItem = useCallback(
    ({ item: id, extraData }: ListRenderItemInfo<string>) => (
      <EntryNormalItem entryId={id} extraData={extraData as EntryExtraData} view={view} />
    ),
    [view],
  )

  const ListFooterComponent = useMemo(
    () => (hasNextPage ? <EntryItemSkeleton /> : <EntryListFooter />),
    [hasNextPage],
  )

  const { onScroll: hackOnScroll, ref, style: hackStyle } = usePagerListPerformanceHack()

  const { onViewableItemsChanged, onScroll, viewableItems } = useOnViewableItemsChanged({
    disabled: active === false || isFetching,
    onScroll: hackOnScroll,
  })

  useImperativeHandle(forwardRef, () => ref.current!)

  usePrefetchEntryTranslation({ entryIds: active ? viewableItems.map((item) => item.key) : [] })

  return (
    <TimelineSelectorList
      ref={ref}
      onRefresh={refetch}
      isRefetching={isRefetching}
      data={entryIds}
      extraData={extraData}
      keyExtractor={defaultKeyExtractor}
      estimatedItemSize={100}
      renderItem={renderItem}
      onEndReached={fetchNextPage}
      onScroll={onScroll}
      onViewableItemsChanged={onViewableItemsChanged}
      ItemSeparatorComponent={ItemSeparator}
      ListFooterComponent={ListFooterComponent}
      style={hackStyle}
    />
  )
}

const defaultKeyExtractor = (id: string) => id

export function EntryItemSkeleton() {
  return (
    <View className="bg-system-background flex flex-row items-center p-4">
      <View className="flex flex-1 flex-col gap-2">
        <View className="flex flex-row gap-2">
          {/* Icon skeleton */}
          <View className="bg-system-fill size-4 animate-pulse rounded-full" />
          <View className="bg-system-fill h-4 w-1/4 animate-pulse rounded-md" />
        </View>

        {/* Title skeleton */}
        <View className="bg-system-fill h-4 w-3/4 animate-pulse rounded-md" />
        {/* Description skeleton */}
        <View className="bg-system-fill w-full flex-1 animate-pulse rounded-md" />
      </View>

      {/* Image skeleton */}
      <View className="bg-system-fill ml-2 size-20 animate-pulse rounded-md" />
    </View>
  )
}

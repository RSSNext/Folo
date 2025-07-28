import type { FeedViewType } from "@follow/constants"
import { usePrefetchEntryTranslation } from "@follow/store/translation/hooks"
import type { FlashList, ListRenderItemInfo } from "@shopify/flash-list"
import type { ElementRef } from "react"
import { useCallback, useImperativeHandle, useMemo, useRef } from "react"
import { View } from "react-native"

import { useActionLanguage, useGeneralSettingKey } from "@/src/atoms/settings/general"
import { useBottomTabBarHeight } from "@/src/components/layouts/tabbar/hooks"
import { checkLanguage } from "@/src/lib/translation"
import { useHeaderHeight } from "@/src/modules/screen/hooks/useHeaderHeight"

import { useEntries } from "../screen/atoms"
import { TimelineSelectorList } from "../screen/TimelineSelectorList"
import { EntryListFooter } from "./EntryListFooter"
import { useOnViewableItemsChanged } from "./hooks"
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
  const extraData: EntryExtraData = useMemo(() => ({ entryIds }), [entryIds])

  const { fetchNextPage, isFetching, refetch, isRefetching, hasNextPage, fetchedTime, isReady } =
    useEntries()

  const renderItem = useCallback(
    ({ item: id, extraData }: ListRenderItemInfo<string>) => (
      <EntryNormalItem entryId={id} extraData={extraData as EntryExtraData} view={view} />
    ),
    [view],
  )

  const ListFooterComponent = useMemo(
    () => (hasNextPage ? <EntryItemSkeleton /> : <EntryListFooter fetchedTime={fetchedTime} />),
    [hasNextPage, fetchedTime],
  )

  const ref = useRef<FlashList<any>>(null)

  const { onViewableItemsChanged, onScroll, viewableItems } = useOnViewableItemsChanged({
    disabled: active === false || isFetching,
  })

  useImperativeHandle(forwardRef, () => ref.current!)

  const translation = useGeneralSettingKey("translation")
  const actionLanguage = useActionLanguage()
  usePrefetchEntryTranslation({
    entryIds: active ? viewableItems.map((item) => item.key) : [],
    language: actionLanguage,
    setting: translation,
    checkLanguage,
  })

  const headerHeight = useHeaderHeight()
  const tabBarHeight = useBottomTabBarHeight()

  // Show loading skeleton when entries are not ready and no data yet
  if (!isReady && (!entryIds || entryIds.length === 0)) {
    return (
      <View className="flex-1" style={{ paddingTop: headerHeight, paddingBottom: tabBarHeight }}>
        {Array.from({ length: 7 }).map((_, index) => (
          <EntryItemSkeleton key={index} />
        ))}
      </View>
    )
  }

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

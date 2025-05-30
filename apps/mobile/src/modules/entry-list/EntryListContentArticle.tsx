import type { FeedViewType } from "@follow/constants"
import { useEntryStore } from "@follow/store/entry" // Corrected import
import { useFeedStore } from "@follow/store/feed" // Corrected import
import { usePrefetchEntryTranslation } from "@follow/store/translation/hooks"
import type { ListRenderItemInfo } from "@shopify/flash-list"
import { useAtomValue } from "jotai"
import type { ElementRef } from "react"
import { useCallback, useImperativeHandle, useMemo } from "react"
import { View } from "react-native"

import { timelineSearchQueryAtom } from "@/src/atoms/search"
import { useActionLanguage, useGeneralSettingKey } from "@/src/atoms/settings/general"
import { usePlayingUrl } from "@/src/lib/player"
import { checkLanguage } from "@/src/lib/translation"

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
  const searchQuery = useAtomValue(timelineSearchQueryAtom)

  // Access the full map of entries and feeds from the store
  const entryMap = useEntryStore((state) => state.data) || {} // Use correct store and selector
  const feedMap = useFeedStore((state) => state.feeds) || {} // Use correct store and selector

  const filteredEntryIds = useMemo(() => {
    if (!entryIds) return null // Keep null if original entryIds is null

    if (!searchQuery.trim()) {
      return entryIds // Return original IDs if search query is empty
    }

    const lowerCaseQuery = searchQuery.toLowerCase()

    return entryIds.filter((id) => {
      const entry = entryMap[id]
      if (!entry) return false

      const feed = entry.feedId ? feedMap[entry.feedId] : undefined

      const titleMatch = entry.title?.toLowerCase().includes(lowerCaseQuery)
      const feedNameMatch = feed?.title?.toLowerCase().includes(lowerCaseQuery)
      // Prefer content_text if available, otherwise fallback to description
      const contentToSearch = entry.content_text || entry.description || ""
      const contentMatch = contentToSearch.toLowerCase().includes(lowerCaseQuery)

      // Assuming authors is an array of objects like { name: string } or an array of strings.
      // This needs to be confirmed from EntryModel definition.
      const authorMatch = entry.authors?.some((author) => {
        if (typeof author === "string") {
          return author.toLowerCase().includes(lowerCaseQuery)
        }
        // If author is an object, check for 'name' or a similar property
        return (
          author?.name?.toLowerCase().includes(lowerCaseQuery) ||
          (author &&
            author.name === undefined &&
            Object.values(author).some(
              (val) => typeof val === "string" && val.toLowerCase().includes(lowerCaseQuery),
            ))
        )
      })

      return titleMatch || feedNameMatch || contentMatch || authorMatch
    })
  }, [entryIds, searchQuery, entryMap, feedMap])

  const extraData: EntryExtraData = useMemo(
    () => ({ playingAudioUrl, entryIds: filteredEntryIds }),
    [playingAudioUrl, filteredEntryIds],
  )

  const { fetchNextPage, isFetching, refetch, isRefetching, hasNextPage } =
    useFetchEntriesControls()

  const renderItem = useCallback(
    ({ item: id, extraData }: ListRenderItemInfo<string>) => (
      // EntryNormalItem internally uses useEntry(id) and useFeed(feedId), so it will get the correct data
      <EntryNormalItem entryId={id} extraData={extraData as EntryExtraData} view={view} />
    ),
    [view],
  )

  const ListFooterComponent = useMemo(
    () =>
      hasNextPage && filteredEntryIds && filteredEntryIds.length > 0 ? (
        <EntryItemSkeleton />
      ) : (
        <EntryListFooter />
      ),
    [hasNextPage, filteredEntryIds],
  )

  const { onScroll: hackOnScroll, ref, style: hackStyle } = usePagerListPerformanceHack()

  const { onViewableItemsChanged, onScroll, viewableItems } = useOnViewableItemsChanged({
    disabled: active === false || isFetching,
    onScroll: hackOnScroll,
  })

  useImperativeHandle(forwardRef, () => ref.current!)

  const translation = useGeneralSettingKey("translation")
  const actionLanguage = useActionLanguage()
  usePrefetchEntryTranslation({
    // Use filteredEntryIds for prefetching if applicable, or ensure original viewableItems are used if prefetch is independent of search
    entryIds:
      active && filteredEntryIds
        ? viewableItems
            .filter((item) => filteredEntryIds.includes(item.key))
            .map((item) => item.key)
        : [],
    language: actionLanguage,
    translation,
    checkLanguage,
  })

  return (
    <TimelineSelectorList
      ref={ref}
      onRefresh={refetch}
      isRefetching={isRefetching}
      data={filteredEntryIds} // Pass filtered IDs to the list
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

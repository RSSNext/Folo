import { useTypeScriptHappyCallback } from "@follow/hooks"
import { useEntryStore } from "@follow/store/entry" // Corrected import
import { useFeedStore } from "@follow/store/feed" // Corrected import
import { usePrefetchEntryTranslation } from "@follow/store/translation/hooks"
import type { MasonryFlashListProps } from "@shopify/flash-list"
import { useAtomValue } from "jotai"
import type { ElementRef } from "react"
import { useImperativeHandle, useMemo } from "react"
import { View } from "react-native"

import { timelineSearchQueryAtom } from "@/src/atoms/search"
import { useActionLanguage, useGeneralSettingKey } from "@/src/atoms/settings/general"
import { checkLanguage } from "@/src/lib/translation"
import { useFetchEntriesControls } from "@/src/modules/screen/atoms"

import { TimelineSelectorMasonryList } from "../screen/TimelineSelectorList"
import { GridEntryListFooter } from "./EntryListFooter"
import { useOnViewableItemsChanged, usePagerListPerformanceHack } from "./hooks"
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
  const { onScroll: hackOnScroll, ref, style: hackStyle } = usePagerListPerformanceHack()
  useImperativeHandle(forwardRef, () => ref.current!)
  const { fetchNextPage, refetch, isRefetching, isFetching, hasNextPage } =
    useFetchEntriesControls()

  const searchQuery = useAtomValue(timelineSearchQueryAtom)
  const entryMap = useEntryStore((state) => state.data) || {} // Use correct store and selector
  const feedMap = useFeedStore((state) => state.feeds) || {} // Use correct store and selector

  const filteredEntryIds = useMemo(() => {
    if (!entryIds) return null
    if (!searchQuery.trim()) {
      return entryIds
    }
    const lowerCaseQuery = searchQuery.toLowerCase()
    return entryIds.filter((id) => {
      const entry = entryMap[id]
      if (!entry) return false
      const feed = entry.feedId ? feedMap[entry.feedId] : undefined
      const titleMatch = entry.title?.toLowerCase().includes(lowerCaseQuery)
      const feedNameMatch = feed?.title?.toLowerCase().includes(lowerCaseQuery)
      const contentToSearch = entry.content_text || entry.description || ""
      const contentMatch = contentToSearch.toLowerCase().includes(lowerCaseQuery)
      const authorMatch = entry.authors?.some((author) => {
        if (typeof author === "string") return author.toLowerCase().includes(lowerCaseQuery)
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

  const { onViewableItemsChanged, onScroll, viewableItems } = useOnViewableItemsChanged({
    disabled: active === false || isFetching,
    onScroll: hackOnScroll,
  })

  const translation = useGeneralSettingKey("translation")
  const actionLanguage = useActionLanguage()
  usePrefetchEntryTranslation({
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

  const ListFooterComponent = useMemo(
    () =>
      hasNextPage && filteredEntryIds && filteredEntryIds.length > 0 ? ( // Consider filtered list for skeleton
        <View className="flex flex-row justify-between">
          <EntryItemSkeleton />
          <EntryItemSkeleton />
        </View>
      ) : (
        <GridEntryListFooter />
      ),
    [hasNextPage, filteredEntryIds],
  )

  return (
    <TimelineSelectorMasonryList
      ref={ref}
      isRefetching={isRefetching}
      data={filteredEntryIds} // Use filtered IDs
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
}

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

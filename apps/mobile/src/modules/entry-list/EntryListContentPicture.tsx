import { useTypeScriptHappyCallback } from "@follow/hooks"
import { useEntryStore } from "@follow/store/entry" // Corrected import
import { useFeedStore } from "@follow/store/feed" // Corrected import
import { usePrefetchEntryTranslation } from "@follow/store/translation/hooks"
import type { MasonryFlashListProps } from "@shopify/flash-list"
import { useAtomValue } from "jotai"
import type { ElementRef } from "react"
import { useImperativeHandle, useMemo } from "react" // Added useMemo
import { View } from "react-native"

import { timelineSearchQueryAtom } from "@/src/atoms/search"
import { useActionLanguage, useGeneralSettingKey } from "@/src/atoms/settings/general"
import { PlatformActivityIndicator } from "@/src/components/ui/loading/PlatformActivityIndicator"
import { checkLanguage } from "@/src/lib/translation"
import { useFetchEntriesControls } from "@/src/modules/screen/atoms"

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
  const { fetchNextPage, refetch, isRefetching, hasNextPage, isFetching } =
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
    checkLanguage,
    translation,
  })

  return (
    <TimelineSelectorMasonryList
      ref={ref}
      isRefetching={isRefetching}
      data={filteredEntryIds} // Use filtered IDs
      renderItem={useTypeScriptHappyCallback(({ item }: { item: string }) => {
        return <EntryPictureItem id={item} />
      }, [])}
      keyExtractor={defaultKeyExtractor}
      onViewableItemsChanged={onViewableItemsChanged}
      onScroll={onScroll}
      onEndReached={fetchNextPage}
      numColumns={2}
      style={hackStyle}
      estimatedItemSize={100}
      ListFooterComponent={
        hasNextPage && filteredEntryIds && filteredEntryIds.length > 0 ? ( // Consider filtered list for skeleton
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

const defaultKeyExtractor = (item: string) => {
  return item
}

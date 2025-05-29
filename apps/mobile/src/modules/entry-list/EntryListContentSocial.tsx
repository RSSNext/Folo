import { useEntryStore } from "@follow/store/entry" // Corrected import
import type { EntryModel } from "@follow/store/entry/types"
import { useFeedStore } from "@follow/store/feed"   // Corrected import
import type { Feed } from "@follow/store/feed/types"
import { usePrefetchEntryTranslation } from "@follow/store/translation/hooks"
import type { ListRenderItemInfo } from "@shopify/flash-list"
import { useAtomValue } from "jotai"
import type { ElementRef } from "react"
import { useCallback, useImperativeHandle, useMemo } from "react"
import { View } from "react-native"

import { timelineSearchQueryAtom } from "@/src/atoms/search"
import { useActionLanguage, useGeneralSettingKey } from "@/src/atoms/settings/general"
import { checkLanguage } from "@/src/lib/translation"

import { useFetchEntriesControls } from "../screen/atoms"
import { TimelineSelectorList } from "../screen/TimelineSelectorList"
import { EntryListFooter } from "./EntryListFooter"
import { useOnViewableItemsChanged, usePagerListPerformanceHack } from "./hooks"
import { ItemSeparatorFullWidth } from "./ItemSeparator"
import { EntrySocialItem } from "./templates/EntrySocialItem"
import type { EntryExtraData } from "./types"

export const EntryListContentSocial = ({
  ref: forwardRef,
  entryIds,
  active,
}: { entryIds: string[] | null; active?: boolean } & {
  ref?: React.Ref<ElementRef<typeof TimelineSelectorList> | null>
}) => {
  const { fetchNextPage, isFetching, refetch, isRefetching, hasNextPage } =
    useFetchEntriesControls()

  const searchQuery = useAtomValue(timelineSearchQueryAtom)
  const entryMap = useEntryStore(state => state.data) || {} // Use correct store and selector
  const feedMap = useFeedStore(state => state.feeds) || {}   // Use correct store and selector

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
        return author?.name?.toLowerCase().includes(lowerCaseQuery) || (author && typeof author.name === 'undefined' && Object.values(author).some(val => typeof val === 'string' && val.toLowerCase().includes(lowerCaseQuery)));
      })
      return titleMatch || feedNameMatch || contentMatch || authorMatch
    })
  }, [entryIds, searchQuery, entryMap, feedMap])

  const extraData: EntryExtraData = useMemo(() => ({ playingAudioUrl: null, entryIds: filteredEntryIds }), [filteredEntryIds])

  const { onScroll: hackOnScroll, ref, style: hackStyle } = usePagerListPerformanceHack()
  useImperativeHandle(forwardRef, () => ref.current!)
  // eslint-disable-next-line @eslint-react/hooks-extra/no-unnecessary-use-callback
  const renderItem = useCallback(
    ({ item: id, extraData }: ListRenderItemInfo<string>) => (
      <EntrySocialItem entryId={id} extraData={extraData as EntryExtraData} />
    ),
    [],
  )

  const ListFooterComponent = useMemo(
    () => (hasNextPage && (filteredEntryIds && filteredEntryIds.length > 0) ? <EntryItemSkeleton /> : <EntryListFooter />),
    [hasNextPage, filteredEntryIds],
  )

  const { onViewableItemsChanged, onScroll, viewableItems } = useOnViewableItemsChanged({
    disabled: active === false || isFetching,
    onScroll: hackOnScroll,
  })

  const translation = useGeneralSettingKey("translation")
  const actionLanguage = useActionLanguage()
  usePrefetchEntryTranslation({
    entryIds: active && filteredEntryIds ? viewableItems.filter(item => filteredEntryIds.includes(item.key)).map((item) => item.key) : [],
    language: actionLanguage,
    translation,
    checkLanguage,
  })

  return (
    <TimelineSelectorList
      ref={ref}
      onRefresh={() => {
        refetch()
      }}
      isRefetching={isRefetching}
      data={filteredEntryIds} // Use filtered IDs
      extraData={extraData}
      keyExtractor={(id) => id}
      estimatedItemSize={100}
      renderItem={renderItem}
      onEndReached={fetchNextPage}
      onViewableItemsChanged={onViewableItemsChanged}
      onScroll={onScroll}
      ItemSeparatorComponent={ItemSeparatorFullWidth}
      ListFooterComponent={ListFooterComponent}
      style={hackStyle}
    />
  )
}

export function EntryItemSkeleton() {
  return (
    <View className="flex flex-col gap-2 p-4">
      {/* Header row with avatar, author, and date */}
      <View className="flex flex-1 flex-row items-center gap-2">
        <View className="bg-system-fill size-8 animate-pulse rounded-full" />
        <View className="bg-system-fill h-4 w-24 animate-pulse rounded-md" />
        <View className="bg-system-fill h-3 w-20 animate-pulse rounded-md" />
      </View>

      {/* Description area */}
      <View className="ml-10 space-y-2">
        <View className="bg-system-fill h-4 w-full animate-pulse rounded-md rounded-bl-none" />
        <View className="bg-system-fill h-4 w-3/4 animate-pulse rounded-md rounded-tl-none" />
      </View>

      {/* Media preview area */}
      <View className="ml-10 flex flex-row gap-2">
        <View className="bg-system-fill size-20 animate-pulse rounded-md" />
        <View className="bg-system-fill size-20 animate-pulse rounded-md" />
      </View>
    </View>
  )
}

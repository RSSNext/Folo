import type { FeedViewType } from "@follow/constants"
import { UserRole } from "@follow/constants"
import { shouldRenderScrollMarkReadEndSpacer } from "@follow/shared/scroll-mark-read"
import { usePrefetchEntryTranslation } from "@follow/store/translation/hooks"
import { useUserRole } from "@follow/store/user/hooks"
import type { FlashListRef, ListRenderItemInfo } from "@shopify/flash-list"
import type { ElementRef } from "react"
import { useCallback, useImperativeHandle, useMemo, useRef } from "react"
import { View } from "react-native"

import { useActionLanguage, useGeneralSettingKey } from "@/src/atoms/settings/general"
import { Skeleton, SkeletonPulse } from "@/src/components/ui/skeleton/Skeleton"
import { useReadableContainerStyle } from "@/src/lib/responsive"

import { useEntries } from "../screen/atoms"
import { getResetScrollSignalForContent } from "../screen/scroll-reset"
import { TimelineSelectorList } from "../screen/TimelineSelectorList"
import { EntryListEndScrollSpacer } from "./EntryListEndScrollSpacer"
import { EntryListFooter } from "./EntryListFooter"
import { useOnViewableItemsChanged } from "./hooks"
import { ItemSeparatorFullWidth } from "./ItemSeparator"
import {
  shouldAnimateLoadingPlaceholder,
  shouldAnimateNextPagePlaceholder,
} from "./placeholder-animation"
import { EntrySocialItem } from "./templates/EntrySocialItem"
import type { EntryExtraData } from "./types"

// The same centred column as the Articles view on iPad, so posts don't run the full screen width
const READABLE_MAX_WIDTH = 860
const READABLE_GUTTER = 16

const ReadableItemSeparator = () => {
  const readableItemStyle = useReadableContainerStyle(READABLE_MAX_WIDTH, READABLE_GUTTER)
  return (
    <View style={readableItemStyle}>
      <ItemSeparatorFullWidth />
    </View>
  )
}

export const EntryListContentSocial = ({
  ref: forwardRef,
  entryIds,
  active,
  view,
  onResetScrollSignalConsumed,
  resetScrollSignal,
  suspendMarkRead,
}: { entryIds: string[] | null; active?: boolean; view: FeedViewType } & {
  ref?: React.Ref<ElementRef<typeof TimelineSelectorList> | null>
  onResetScrollSignalConsumed?: (signal: number) => void
  resetScrollSignal?: number
  suspendMarkRead?: boolean
}) => {
  const {
    error: entriesError,
    fetchNextPage,
    isFetching,
    isFetchingNextPage,
    refetch,
    isRefetching,
    hasNextPage,
    isReady,
    fetchedTime,
  } = useEntries({
    viewId: view,
    active,
  })
  const extraData: EntryExtraData = useMemo(() => ({ entryIds }), [entryIds])
  const readableItemStyle = useReadableContainerStyle(READABLE_MAX_WIDTH, READABLE_GUTTER)

  const ref = useRef<FlashListRef<any>>(null)
  useImperativeHandle(forwardRef, () => ref.current!)
  const renderItem = useCallback(
    ({ item: id, extraData }: ListRenderItemInfo<string>) => (
      <View style={readableItemStyle}>
        <EntrySocialItem entryId={id} extraData={extraData as EntryExtraData} />
      </View>
    ),
    [readableItemStyle],
  )

  const hasEndSpacer = shouldRenderScrollMarkReadEndSpacer({
    entryCount: entryIds?.length ?? 0,
    hasNextPage,
  })
  const animateNextPagePlaceholder = shouldAnimateNextPagePlaceholder({
    active,
    isFetchingNextPage,
  })
  const ListFooterComponent = useMemo(
    () =>
      hasNextPage ? (
        <View style={readableItemStyle}>
          <EntryItemSkeleton animated={animateNextPagePlaceholder} />
        </View>
      ) : (
        <View>
          <EntryListFooter fetchedTime={fetchedTime} />
          {hasEndSpacer && <EntryListEndScrollSpacer />}
        </View>
      ),
    [hasEndSpacer, hasNextPage, fetchedTime, animateNextPagePlaceholder, readableItemStyle],
  )
  const animateLoadingPlaceholder = shouldAnimateLoadingPlaceholder({ active })
  const renderLoadingSkeleton = useCallback(
    () => (
      <View style={readableItemStyle}>
        <EntryItemSkeleton animated={animateLoadingPlaceholder} />
      </View>
    ),
    [animateLoadingPlaceholder, readableItemStyle],
  )

  const { onViewableItemsChanged, onScroll, viewableItems } = useOnViewableItemsChanged({
    // Loading the next page only appends entries, so the ones scrolled past meanwhile still count
    disabled: active === false || (isFetching && !isFetchingNextPage) || suspendMarkRead,
    refreshing: isFetching && !isFetchingNextPage,
  })

  const translation = useGeneralSettingKey("translation")
  const translationMode = useGeneralSettingKey("translationMode")
  const actionLanguage = useActionLanguage()
  const userRole = useUserRole()
  const translationPrefetchEnabled =
    translation && (userRole == null || (userRole !== UserRole.Free && userRole !== UserRole.Trial))
  usePrefetchEntryTranslation({
    entryIds: active ? viewableItems.map((item) => item.key) : [],
    language: actionLanguage,
    enabled: translationPrefetchEnabled,
    mode: translationMode,
  })

  const contentResetScrollSignal = getResetScrollSignalForContent({
    entryCount: entryIds?.length ?? 0,
    hasScrollableSkeleton: true,
    isReady,
    resetScrollSignal,
  })

  // Show loading skeleton when entries are not ready and no data yet
  if (!isReady && (!entryIds || entryIds.length === 0)) {
    return (
      <TimelineSelectorList
        // FlashList only listens for viewable items if it mounts with onViewableItemsChanged, so
        // the entries list must mount on its own instead of taking over this one, or scrolling
        // it never marks entries read
        key="placeholder"
        onRefresh={() => {}}
        isRefetching={false}
        onResetScrollSignalConsumed={onResetScrollSignalConsumed}
        resetScrollSignal={contentResetScrollSignal}
        data={Array.from({ length: 5 }).map((_, index) => `skeleton-${index}`)}
        keyExtractor={(id) => id}
        renderItem={renderLoadingSkeleton}
        ItemSeparatorComponent={ReadableItemSeparator}
      />
    )
  }

  return (
    <TimelineSelectorList
      ref={ref}
      onRefresh={() => {
        refetch()
      }}
      isRefetching={isRefetching}
      emptyError={entriesError}
      onResetScrollSignalConsumed={onResetScrollSignalConsumed}
      resetScrollSignal={contentResetScrollSignal}
      data={entryIds}
      extraData={extraData}
      keyExtractor={(id) => id}
      renderItem={renderItem}
      onEndReached={fetchNextPage}
      onViewableItemsChanged={onViewableItemsChanged}
      onScroll={onScroll}
      ItemSeparatorComponent={ReadableItemSeparator}
      ListFooterComponent={ListFooterComponent}
    />
  )
}

export function EntryItemSkeleton({ animated }: { animated?: boolean }) {
  return (
    <SkeletonPulse animated={animated} className="flex flex-col gap-2 p-4">
      {/* Header row with avatar, author, and date */}
      <View className="flex flex-1 flex-row items-center gap-2">
        <Skeleton className="size-8 rounded-full" />
        <Skeleton className="h-4 w-24 rounded-md" />
        <Skeleton className="h-3 w-20 rounded-md" />
      </View>

      {/* Description area */}
      <View className="ml-10 space-y-2">
        <Skeleton className="h-4 w-full rounded-md rounded-bl-none" />
        <Skeleton className="h-4 w-3/4 rounded-md rounded-tl-none" />
      </View>

      {/* Media preview area */}
      <View className="ml-10 flex flex-row gap-2">
        <Skeleton className="size-20 rounded-md" />
        <Skeleton className="size-20 rounded-md" />
      </View>
    </SkeletonPulse>
  )
}

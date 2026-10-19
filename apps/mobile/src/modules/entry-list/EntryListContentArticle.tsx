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
import { useBottomTabBarHeight } from "@/src/components/layouts/tabbar/hooks"
import { Skeleton, SkeletonPulse } from "@/src/components/ui/skeleton/Skeleton"
import { useReadableContainerStyle } from "@/src/lib/responsive"
import { useHeaderHeight } from "@/src/modules/screen/hooks/useHeaderHeight"

import { useEntries } from "../screen/atoms"
import { TimelineSelectorList } from "../screen/TimelineSelectorList"
import { EntryListEndScrollSpacer } from "./EntryListEndScrollSpacer"
import { EntryListFooter } from "./EntryListFooter"
import { useOnViewableItemsChanged } from "./hooks"
import {
  shouldAnimateLoadingPlaceholder,
  shouldAnimateNextPagePlaceholder,
} from "./placeholder-animation"
import { EntryNormalItem } from "./templates/EntryNormalItem"
import type { EntryExtraData } from "./types"

const ARTICLE_SKELETON_KEYS = [
  "article-skeleton-1",
  "article-skeleton-2",
  "article-skeleton-3",
  "article-skeleton-4",
  "article-skeleton-5",
  "article-skeleton-6",
  "article-skeleton-7",
] as const

export const EntryListContentArticle = ({
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
  const extraData: EntryExtraData = useMemo(() => ({ entryIds }), [entryIds])
  const readableItemStyle = useReadableContainerStyle(860, 16)

  const {
    error: entriesError,
    fetchNextPage,
    isFetching,
    isFetchingNextPage,
    refetch,
    isRefetching,
    hasNextPage,
    fetchedTime,
    isReady,
  } = useEntries({ viewId: view, active })

  const renderItem = useCallback(
    ({ item: id, extraData, index }: ListRenderItemInfo<string>) => (
      <View style={readableItemStyle}>
        <EntryNormalItem
          entryId={id}
          extraData={extraData as EntryExtraData}
          view={view}
          hasTopSeparator={index > 0}
          testID={index === 0 ? "timeline-entry-first" : undefined}
        />
      </View>
    ),
    [readableItemStyle, view],
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
        <EntryItemSkeleton animated={animateNextPagePlaceholder} />
      ) : (
        <View>
          <EntryListFooter fetchedTime={fetchedTime} />
          {hasEndSpacer && <EntryListEndScrollSpacer />}
        </View>
      ),
    [hasEndSpacer, hasNextPage, fetchedTime, animateNextPagePlaceholder],
  )

  const ref = useRef<FlashListRef<any>>(null)

  const { onViewableItemsChanged, onScroll, viewableItems } = useOnViewableItemsChanged({
    // Loading the next page only appends entries, so the ones scrolled past meanwhile still count
    disabled: active === false || (isFetching && !isFetchingNextPage) || suspendMarkRead,
    refreshing: isFetching && !isFetchingNextPage,
  })

  useImperativeHandle(forwardRef, () => ref.current!)

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

  const headerHeight = useHeaderHeight()
  const tabBarHeight = useBottomTabBarHeight()

  // Show loading skeleton when entries are not ready and no data yet
  if (!isReady && (!entryIds || entryIds.length === 0)) {
    return (
      <View className="flex-1" style={{ paddingTop: headerHeight, paddingBottom: tabBarHeight }}>
        {ARTICLE_SKELETON_KEYS.map((key) => (
          <View key={key} style={readableItemStyle}>
            <EntryItemSkeleton animated={shouldAnimateLoadingPlaceholder({ active })} />
          </View>
        ))}
      </View>
    )
  }

  return (
    <TimelineSelectorList
      ref={ref}
      onRefresh={refetch}
      isRefetching={isRefetching}
      emptyError={entriesError}
      onResetScrollSignalConsumed={onResetScrollSignalConsumed}
      resetScrollSignal={resetScrollSignal}
      data={entryIds}
      extraData={extraData}
      keyExtractor={defaultKeyExtractor}
      renderItem={renderItem}
      onEndReached={fetchNextPage}
      onScroll={onScroll}
      onViewableItemsChanged={onViewableItemsChanged}
      ListFooterComponent={ListFooterComponent}
    />
  )
}

const defaultKeyExtractor = (id: string) => id

export function EntryItemSkeleton({ animated }: { animated?: boolean }) {
  return (
    <SkeletonPulse
      animated={animated}
      className="flex flex-row items-center bg-system-background p-4"
    >
      <View className="flex flex-1 flex-col gap-2">
        <View className="flex flex-row gap-2">
          {/* Icon skeleton */}
          <Skeleton className="size-4 rounded-full" />
          <Skeleton className="h-4 w-1/4 rounded-md" />
        </View>

        {/* Title skeleton */}
        <Skeleton className="h-4 w-3/4 rounded-md" />
        {/* Description skeleton */}
        <Skeleton className="w-full flex-1 rounded-md" />
      </View>

      {/* Image skeleton */}
      <Skeleton className="ml-2 size-20 rounded-md" />
    </SkeletonPulse>
  )
}

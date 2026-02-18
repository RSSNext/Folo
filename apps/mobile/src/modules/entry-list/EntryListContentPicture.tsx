import type { FeedViewType } from "@follow/constants"
import { isFreeRole } from "@follow/constants"
import { useTypeScriptHappyCallback } from "@follow/hooks"
import { usePrefetchEntryTranslation } from "@follow/store/translation/hooks"
import { useUserRole } from "@follow/store/user/hooks"
import type { FlashListProps, FlashListRef } from "@shopify/flash-list"
import type { ElementRef } from "react"
import { useImperativeHandle, useRef } from "react"
import { StyleSheet, View } from "react-native"

import { useActionLanguage, useGeneralSettingKey } from "@/src/atoms/settings/general"
import { useBottomTabBarHeight } from "@/src/components/layouts/tabbar/hooks"
import { PlatformActivityIndicator } from "@/src/components/ui/loading/PlatformActivityIndicator"
import { useEntries } from "@/src/modules/screen/atoms"
import { useHeaderHeight } from "@/src/modules/screen/hooks/useHeaderHeight"

import { TimelineSelectorMasonryList } from "../screen/TimelineSelectorList"
import { GridEntryListFooter } from "./EntryListFooter"
import { useOnViewableItemsChanged } from "./hooks"
// import type { MasonryItem } from "./templates/EntryGridItem"
import { EntryPictureItem } from "./templates/EntryPictureItem"

const PICTURE_SKELETON_COLUMN_KEYS = [
  "picture-skeleton-1",
  "picture-skeleton-2",
  "picture-skeleton-3",
  "picture-skeleton-4",
] as const

export const EntryListContentPicture = ({
  ref: forwardRef,
  entryIds,
  active,
  view,
  ...rest
}: { entryIds: string[] | null; active?: boolean; view: FeedViewType } & Omit<
  FlashListProps<string>,
  "data" | "renderItem"
> & { ref?: React.Ref<ElementRef<typeof TimelineSelectorMasonryList> | null> }) => {
  const ref = useRef<FlashListRef<any>>(null)

  useImperativeHandle(forwardRef, () => ref.current!)
  const { fetchNextPage, refetch, isRefetching, hasNextPage, isFetching, isReady } = useEntries({
    viewId: view,
    active,
  })
  const { onViewableItemsChanged, onScroll, viewableItems } = useOnViewableItemsChanged({
    disabled: active === false || isFetching,
  })
  const translation = useGeneralSettingKey("translation")
  const translationMode = useGeneralSettingKey("translationMode")
  const actionLanguage = useActionLanguage()
  const userRole = useUserRole()
  const translationPrefetchEnabled = translation && !isFreeRole(userRole)
  usePrefetchEntryTranslation({
    entryIds: active ? viewableItems.map((item) => item.key) : [],
    language: actionLanguage,
    enabled: translationPrefetchEnabled,
    mode: translationMode,
  })

  const renderItem = useTypeScriptHappyCallback(({ item }: { item: string }) => {
    return <EntryPictureItem id={item} />
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
            {PICTURE_SKELETON_COLUMN_KEYS.map((key, index) => (
              <EntryPictureItemSkeleton key={`left-${key}`} variantIndex={index} />
            ))}
          </View>
          <View className="ml-1 flex-1">
            {PICTURE_SKELETON_COLUMN_KEYS.map((key, index) => (
              <EntryPictureItemSkeleton
                key={`right-${key}`}
                variantIndex={index + PICTURE_SKELETON_COLUMN_KEYS.length}
              />
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
      contentContainerStyle={styles.contentContainer}
      ListFooterComponent={
        hasNextPage ? (
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

function EntryPictureItemSkeleton({ variantIndex }: { variantIndex: number }) {
  const imageHeightStyle =
    PICTURE_SKELETON_HEIGHT_STYLES[variantIndex % PICTURE_SKELETON_HEIGHT_STYLES.length]

  return (
    <View className="mx-1 mb-2">
      {/* Image placeholder */}
      <View className="animate-pulse rounded-md bg-system-fill" style={imageHeightStyle} />

      {/* Footer content */}
      <View className="gap-2 px-1 py-2">
        {/* Title lines */}
        <View className="gap-1">
          <View
            className="h-3 animate-pulse rounded-md bg-system-fill"
            style={styles.titleLinePrimary}
          />
          <View
            className="h-3 animate-pulse rounded-md bg-system-fill"
            style={styles.titleLineSecondary}
          />
        </View>

        {/* Feed info */}
        <View className="flex-row items-center gap-1.5">
          <View className="size-3.5 animate-pulse rounded-full bg-system-fill" />
          <View
            className="h-3 animate-pulse rounded-md bg-system-fill"
            style={styles.feedLinePrimary}
          />
          <View
            className="h-3 animate-pulse rounded-md bg-system-fill"
            style={styles.feedLineSecondary}
          />
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingHorizontal: 8,
  },
  skeletonHeight120: {
    height: 120,
  },
  skeletonHeight160: {
    height: 160,
  },
  skeletonHeight140: {
    height: 140,
  },
  skeletonHeight180: {
    height: 180,
  },
  skeletonHeight100: {
    height: 100,
  },
  skeletonHeight200: {
    height: 200,
  },
  titleLinePrimary: {
    width: "90%",
  },
  titleLineSecondary: {
    width: "70%",
  },
  feedLinePrimary: {
    width: "40%",
  },
  feedLineSecondary: {
    width: "30%",
  },
})

const PICTURE_SKELETON_HEIGHT_STYLES = [
  styles.skeletonHeight120,
  styles.skeletonHeight160,
  styles.skeletonHeight140,
  styles.skeletonHeight180,
  styles.skeletonHeight100,
  styles.skeletonHeight200,
] as const

const defaultKeyExtractor = (item: string) => {
  return item
}

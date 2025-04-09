import { useTypeScriptHappyCallback } from "@follow/hooks"
import type { MasonryFlashListProps } from "@shopify/flash-list"
import type { ElementRef } from "react"
import { forwardRef } from "react"
import { View } from "react-native"

import { PlatformActivityIndicator } from "@/src/components/ui/loading/PlatformActivityIndicator"
import { useFetchEntriesControls } from "@/src/modules/screen/atoms"

import { TimelineSelectorMasonryList } from "../screen/TimelineSelectorList"
import { GridEntryListFooter } from "./EntryListFooter"
import { useOnViewableItemsChanged } from "./hooks"
// import type { MasonryItem } from "./templates/EntryGridItem"
import { EntryPictureItem } from "./templates/EntryPictureItem"

export const EntryListContentPicture = forwardRef<
  ElementRef<typeof TimelineSelectorMasonryList>,
  { entryIds: string[] | null; active?: boolean } & Omit<
    MasonryFlashListProps<string>,
    "data" | "renderItem"
  >
>(({ entryIds, active, ...rest }, ref) => {
  const { fetchNextPage, refetch, isRefetching, hasNextPage, isFetching } =
    useFetchEntriesControls()
  const { onViewableItemsChanged, onScroll } = useOnViewableItemsChanged({
    disabled: active === false || isFetching,
  })

  return (
    <TimelineSelectorMasonryList
      ref={ref}
      isRefetching={isRefetching}
      data={entryIds}
      renderItem={useTypeScriptHappyCallback(({ item }: { item: string }) => {
        return <EntryPictureItem id={item} />
      }, [])}
      keyExtractor={defaultKeyExtractor}
      onViewableItemsChanged={onViewableItemsChanged}
      onScroll={onScroll}
      onEndReached={fetchNextPage}
      numColumns={2}
      estimatedItemSize={100}
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
})

const defaultKeyExtractor = (item: string) => {
  return item
}

import { useTypeScriptHappyCallback } from "@follow/hooks"
import type { MasonryFlashListProps } from "@shopify/flash-list"
import type { ElementRef } from "react"
import { useImperativeHandle } from "react"
import { View } from "react-native"

import { PlatformActivityIndicator } from "@/src/components/ui/loading/PlatformActivityIndicator"
import { useFetchEntriesControls } from "@/src/modules/screen/atoms"
import { usePrefetchEntryTranslation } from "@/src/store/translation/hooks"

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
  const { onViewableItemsChanged, onScroll, viewableItems } = useOnViewableItemsChanged({
    disabled: active === false || isFetching,
    onScroll: hackOnScroll,
  })

  usePrefetchEntryTranslation({ entryIds: active ? viewableItems.map((item) => item.key) : [] })

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
      style={hackStyle}
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
}

const defaultKeyExtractor = (item: string) => {
  return item
}

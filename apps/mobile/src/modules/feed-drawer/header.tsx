import type { FeedViewType } from "@follow/constants"
import type { LayoutChangeEvent } from "react-native"
import { Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { BlurEffect } from "@/src/components/common/BlurEffect"
import { useList } from "@/src/store/list/hooks"

import { SortActionButton } from "../subscription/header-actions"
import { useViewDefinition } from "./atoms"

export const ViewHeaderComponent = ({
  view,
  onLayout,
}: {
  view: FeedViewType
  onLayout?: (event: LayoutChangeEvent) => void
}) => {
  const viewDef = useViewDefinition(view)
  const insets = useSafeAreaInsets()

  return (
    <View
      onLayout={onLayout}
      className="border-b-opaque-separator bg-system-background/90 border-b-hairline absolute inset-x-0 top-0 z-[999] flex flex-row items-center justify-between gap-2 px-4"
      style={{ paddingTop: insets.top }}
    >
      <BlurEffect />
      <Text className="text-text my-4 text-2xl font-bold">{viewDef?.name}</Text>
      <SortActionButton />
    </View>
  )
}

export const ListHeaderComponent = ({ listId }: { listId: string }) => {
  const list = useList(listId)
  const insets = useSafeAreaInsets()
  if (!list) {
    console.warn("list not found:", listId)
    return null
  }
  return (
    <View
      className="border-b-opaque-separator border-b-hairline flex flex-col gap-2 py-4"
      style={{ paddingTop: insets.top }}
    >
      <View className="flex flex-row items-center gap-2">
        <Text className="text-text ml-4 text-2xl font-bold">{list.title}</Text>
      </View>
      {list.description && (
        <Text className="text-secondary-label ml-4 text-sm font-medium">{list.description}</Text>
      )}
    </View>
  )
}

import { Image } from "expo-image"
import { ScrollView, TouchableOpacity, View } from "react-native"
import { Grayscale } from "react-native-color-matrix-image-filters"

import { FallbackIcon } from "@/src/components/ui/icon/fallback-icon"
import type { ViewDefinition } from "@/src/constants/views"
import { views } from "@/src/constants/views"
import { useList } from "@/src/store/list/hooks"
import { useAllListSubscription } from "@/src/store/subscription/hooks"
import { useColor } from "@/src/theme/colors"

import { selectFeed, useSelectedFeed } from "../feed-drawer/atoms"

export function ViewSelector() {
  const lists = useAllListSubscription()

  return (
    <View className="flex items-center justify-between py-2">
      <ScrollView
        horizontal
        contentContainerClassName="flex-row gap-3 items-center px-3"
        showsHorizontalScrollIndicator={false}
      >
        {views.map((view) => (
          <ViewItem key={view.name} view={view} />
        ))}
        {lists.map((listId) => (
          <ListItem key={listId} listId={listId} />
        ))}
      </ScrollView>
    </View>
  )
}

function ViewItem({ view }: { view: ViewDefinition }) {
  const selectedFeed = useSelectedFeed()
  const isActive = selectedFeed.type === "view" && selectedFeed.viewId === view.view

  const bgColor = useColor("gray2")

  return (
    <TouchableOpacity
      className="relative flex size-12 items-center justify-center overflow-hidden rounded-full"
      onPress={() => selectFeed({ type: "view", viewId: view.view })}
      style={{
        backgroundColor: isActive ? view.activeColor : bgColor,
      }}
    >
      <view.icon color={"#fff"} height={21} width={21} />
    </TouchableOpacity>
  )
}

function ListItem({ listId }: { listId: string }) {
  const list = useList(listId)
  const selectedFeed = useSelectedFeed()
  const isActive = selectedFeed.type === "list" && selectedFeed.listId === listId

  if (!list) return null

  return (
    <TouchableOpacity
      className="relative flex size-12 items-center justify-center overflow-hidden rounded-full"
      onPress={() => selectFeed({ type: "list", listId })}
    >
      {list.image ? (
        isActive ? (
          <Image source={list.image} contentFit="cover" className="size-12" />
        ) : (
          <Grayscale>
            <Image source={list.image} contentFit="cover" className="size-12" />
          </Grayscale>
        )
      ) : (
        <FallbackIcon title={list.title} size="100%" gray={!isActive} />
      )}
    </TouchableOpacity>
  )
}

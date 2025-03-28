import { useMutation } from "@tanstack/react-query"
import type { MutableRefObject } from "react"
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react"
import { PixelRatio, StyleSheet, Text, View } from "react-native"

import { HeaderSubmitButton } from "@/src/components/layouts/header/HeaderElements"
import { UINavigationHeaderActionButton } from "@/src/components/layouts/header/NavigationHeader"
import {
  NavigationBlurEffectHeader,
  SafeNavigationScrollView,
} from "@/src/components/layouts/views/SafeNavigationScrollView"
import {
  GroupedInsetListBaseCell,
  GroupedInsetListCard,
  GroupedInsetListSectionHeader,
} from "@/src/components/ui/grouped/GroupedList"
import { FeedIcon } from "@/src/components/ui/icon/feed-icon"
import { ItemPressable } from "@/src/components/ui/pressable/ItemPressable"
import { CheckLineIcon } from "@/src/icons/check_line"
import { getBizFetchErrorMessage } from "@/src/lib/api-fetch"
import { useNavigation } from "@/src/lib/navigation/hooks"
import type { NavigationControllerView } from "@/src/lib/navigation/types"
import { toast } from "@/src/lib/toast"
import { useFeed } from "@/src/store/feed/hooks"
import { useList, usePrefetchOwnedLists } from "@/src/store/list/hooks"
import { listSyncServices } from "@/src/store/list/store"
import {
  useFeedSubscriptionByView,
  usePrefetchSubscription,
  useSortedFeedSubscriptionByAlphabet,
} from "@/src/store/subscription/hooks"
import { accentColor } from "@/src/theme/colors"

const ManageListContext = createContext<{
  nextSelectedFeedIdRef: MutableRefObject<Set<string>>
}>(null!)

export const ManageListScreen: NavigationControllerView<{ id: string }> = ({ id }) => {
  usePrefetchOwnedLists()
  const list = useList(id)

  return (
    <SafeNavigationScrollView
      className="bg-system-grouped-background"
      contentContainerClassName="mt-6"
    >
      {!!list && <ListImpl id={list.id} />}
    </SafeNavigationScrollView>
  )
}

const ListImpl: React.FC<{ id: string }> = ({ id }) => {
  const list = useList(id)!
  usePrefetchSubscription(list.view)

  const subscriptionIds = useFeedSubscriptionByView(list.view)

  const sortedSubscriptionIds = useSortedFeedSubscriptionByAlphabet(subscriptionIds)

  const nextSelectedFeedIdRef = useRef(new Set<string>())
  const ctxValue = useMemo(() => ({ nextSelectedFeedIdRef }), [nextSelectedFeedIdRef])

  const initOnceRef = useRef(false)

  useEffect(() => {
    if (initOnceRef.current) return
    initOnceRef.current = true

    nextSelectedFeedIdRef.current = new Set(list.feedIds)
  }, [list.feedIds])

  const addFeedsToFeedListMutation = useMutation({
    mutationFn: () =>
      listSyncServices.addFeedsToFeedList({
        listId: id,
        feedIds: Array.from(nextSelectedFeedIdRef.current),
      }),
  })
  const navigation = useNavigation()
  return (
    <ManageListContext.Provider value={ctxValue}>
      <NavigationBlurEffectHeader
        title={`Manage List - ${list?.title}`}
        headerRight={() => (
          <UINavigationHeaderActionButton>
            <HeaderSubmitButton
              isLoading={addFeedsToFeedListMutation.isPending}
              isValid
              onPress={() => {
                addFeedsToFeedListMutation
                  .mutateAsync()
                  .then(() => {
                    navigation.back()
                  })
                  .catch((error) => {
                    toast.error(getBizFetchErrorMessage(error))
                    console.error(error)
                  })
              }}
            />
          </UINavigationHeaderActionButton>
        )}
      />
      <GroupedInsetListSectionHeader label="Select feeds to add to the current list" />
      <GroupedInsetListCard SeparatorComponent={SeparatorComponent}>
        {sortedSubscriptionIds.map((id) => (
          <FeedCell key={id} feedId={id} isSelected={list.feedIds.includes(id)} />
        ))}
      </GroupedInsetListCard>
    </ManageListContext.Provider>
  )
}

const SeparatorComponent = () => {
  return (
    <View
      className="bg-system-fill ml-16"
      style={{ height: StyleSheet.hairlineWidth }}
      collapsable={false}
    />
  )
}

const FeedCell = (props: { feedId: string; isSelected: boolean }) => {
  const feed = useFeed(props.feedId)

  const { nextSelectedFeedIdRef } = useContext(ManageListContext)

  const [currentSelected, setCurrentSelected] = useState(props.isSelected)

  const iconMariginRight = 36 / PixelRatio.get()
  if (!feed) return null
  return (
    <ItemPressable
      onPress={() => {
        const has = nextSelectedFeedIdRef.current.has(feed.id)
        if (has) {
          nextSelectedFeedIdRef.current.delete(feed.id)
        } else {
          nextSelectedFeedIdRef.current.add(feed.id)
        }

        setCurrentSelected(!has)
      }}
    >
      <GroupedInsetListBaseCell>
        <View className="flex-1 flex-row items-center gap-4">
          <View
            className="size-4 items-center justify-center"
            style={{ marginRight: iconMariginRight }}
          >
            <View className="overflow-hidden rounded-lg">
              <FeedIcon feed={feed} size={24} />
            </View>
          </View>
          <Text className="text-label flex-1" ellipsizeMode="middle" numberOfLines={1}>
            {feed?.title || "Untitled Feed"}
          </Text>
        </View>

        <View className="ml-2 flex size-4 shrink-0 items-center justify-center">
          {currentSelected && <CheckLineIcon color={accentColor} height={18} width={18} />}
        </View>
      </GroupedInsetListBaseCell>
    </ItemPressable>
  )
}

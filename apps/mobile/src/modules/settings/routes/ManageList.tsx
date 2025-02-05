import type { RouteProp } from "@react-navigation/native"
import { useMutation } from "@tanstack/react-query"
import { router } from "expo-router"
import type { MutableRefObject } from "react"
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react"
import { Text, View } from "react-native"

import { ModalHeaderSubmitButton } from "@/src/components/common/ModalSharedComponents"
import {
  NavigationBlurEffectHeader,
  SafeNavigationScrollView,
} from "@/src/components/common/SafeNavigationScrollView"
import {
  GroupedInsetListBaseCell,
  GroupedInsetListCard,
  GroupedInsetListSectionHeader,
} from "@/src/components/ui/grouped/GroupedList"
import { FeedIcon } from "@/src/components/ui/icon/feed-icon"
import { ItemPressable } from "@/src/components/ui/pressable/item-pressable"
import { CheckLineIcon } from "@/src/icons/check_line"
import { getBizFetchErrorMessage } from "@/src/lib/api-fetch"
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

import type { SettingsStackParamList } from "../types"

const ManageListContext = createContext<{
  nextSelectedFeedIdRef: MutableRefObject<Set<string>>
}>(null!)
export const ManageListScreen = ({
  route,
}: {
  route: RouteProp<SettingsStackParamList, "ManageList">
}) => {
  const { id } = route.params

  usePrefetchOwnedLists()
  const list = useList(id)

  return (
    <SafeNavigationScrollView className="bg-system-grouped-background mt-6">
      <NavigationBlurEffectHeader title={`Manage List - ${list?.title}`} />

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
  return (
    <ManageListContext.Provider value={ctxValue}>
      <NavigationBlurEffectHeader
        headerRight={() => (
          <ModalHeaderSubmitButton
            isLoading={addFeedsToFeedListMutation.isPending}
            isValid
            onPress={() => {
              addFeedsToFeedListMutation
                .mutateAsync()
                .then(() => {
                  router.back()
                })
                .catch((error) => {
                  toast.error(getBizFetchErrorMessage(error))
                  console.error(error)
                })
            }}
          />
        )}
      />
      <GroupedInsetListSectionHeader label="Select feeds to add to the current list" />
      <GroupedInsetListCard>
        {sortedSubscriptionIds.map((id) => (
          <FeedCell key={id} feedId={id} isSelected={list.feedIds.includes(id)} />
        ))}
      </GroupedInsetListCard>
    </ManageListContext.Provider>
  )
}

const FeedCell = (props: { feedId: string; isSelected: boolean }) => {
  const feed = useFeed(props.feedId)

  const { nextSelectedFeedIdRef } = useContext(ManageListContext)

  const [currentSelected, setCurrentSelected] = useState(props.isSelected)
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
          <View className="size-4 items-center justify-center">
            <View className="overflow-hidden rounded-lg">
              <FeedIcon feed={feed} size={24} />
            </View>
          </View>
          <Text className="flex-1" ellipsizeMode="middle" numberOfLines={1}>
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

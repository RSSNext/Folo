import { router } from "expo-router"
import { createContext, createElement, useCallback, useContext, useMemo } from "react"
import type { ListRenderItem } from "react-native"
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import Animated, { LinearTransition } from "react-native-reanimated"
import { useColor } from "react-native-uikit-colors"

import { Balance } from "@/src/components/common/Balance"
import {
  NavigationBlurEffectHeader,
  SafeNavigationScrollView,
} from "@/src/components/common/SafeNavigationScrollView"
import {
  GroupedInformationCell,
  GroupedInsetListCard,
} from "@/src/components/ui/grouped/GroupedList"
import { FallbackIcon } from "@/src/components/ui/icon/fallback-icon"
import { ItemPressable } from "@/src/components/ui/pressable/item-pressable"
import { views } from "@/src/constants/views"
import { AddCuteReIcon } from "@/src/icons/add_cute_re"
import { PowerIcon } from "@/src/icons/power"
import { RadaCuteFiIcon } from "@/src/icons/rada_cute_fi"
import { UserAdd2CuteFiIcon } from "@/src/icons/user_add_2_cute_fi"
import { Wallet2CuteFiIcon } from "@/src/icons/wallet_2_cute_fi"
import type { HonoApiClient } from "@/src/morph/types"
import { useOwnedLists, usePrefetchOwnedLists } from "@/src/store/list/hooks"
import type { ListModel } from "@/src/store/list/store"
import { accentColor } from "@/src/theme/colors"

import { SwipeableGroupProvider, SwipeableItem } from "../../../components/common/SwipeableItem"
import { useSettingsNavigation } from "../hooks"

const ListContext = createContext({} as Record<string, HonoApiClient.List_List_Get>)
export const ListsScreen = () => {
  const { isLoading, data } = usePrefetchOwnedLists()
  const lists = useOwnedLists()

  return (
    <SafeNavigationScrollView nestedScrollEnabled className="bg-system-grouped-background">
      <NavigationBlurEffectHeader
        title="Lists"
        headerRight={useCallback(
          () => (
            <AddListButton />
          ),
          [],
        )}
      />

      <View className="mt-6">
        <GroupedInsetListCard>
          <GroupedInformationCell
            title="Lists"
            description="Lists are collections of feeds that you can share or sell for others to subscribe to. Subscribers will synchronize and access all feeds in the list."
            icon={<RadaCuteFiIcon height={40} width={40} color="#fff" />}
            iconBackgroundColor="#34D399"
          />
        </GroupedInsetListCard>
      </View>
      <ListContext.Provider
        value={useMemo(
          () =>
            data?.reduce(
              (acc, list) => {
                acc[list.id] = list
                return acc
              },
              {} as Record<string, HonoApiClient.List_List_Get>,
            ) ?? {},
          [data],
        )}
      >
        <View className="mt-6">
          <GroupedInsetListCard>
            {lists.length > 0 && (
              <SwipeableGroupProvider>
                <Animated.FlatList
                  keyExtractor={keyExtractor}
                  itemLayoutAnimation={LinearTransition}
                  scrollEnabled={false}
                  data={lists}
                  renderItem={ListItemCell}
                  ItemSeparatorComponent={ItemSeparatorComponent}
                />
              </SwipeableGroupProvider>
            )}
            {isLoading && lists.length === 0 && (
              <View className="mt-1">
                <ActivityIndicator />
              </View>
            )}
          </GroupedInsetListCard>
        </View>
      </ListContext.Provider>
    </SafeNavigationScrollView>
  )
}

const AddListButton = () => {
  const labelColor = useColor("label")
  return (
    <TouchableOpacity hitSlop={10} onPress={() => router.push("/list")}>
      <AddCuteReIcon height={20} width={20} color={labelColor} />
    </TouchableOpacity>
  )
}

const ItemSeparatorComponent = () => {
  return (
    <View
      className="bg-opaque-separator ml-24 flex-1"
      style={{ height: StyleSheet.hairlineWidth }}
    />
  )
}

const keyExtractor = (item: ListModel) => item.id

const ListItemCell: ListRenderItem<ListModel> = (props) => {
  return <ListItemCellImpl {...props} />
}
const ListItemCellImpl: ListRenderItem<ListModel> = ({ item: list }) => {
  const { title, description } = list
  const listData = useContext(ListContext)[list.id]
  const navigation = useSettingsNavigation()
  return (
    <SwipeableItem
      swipeRightToCallAction
      rightActions={[
        {
          label: "Manage",
          onPress: () => {
            navigation.navigate("ManageList", { id: list.id })
          },
          backgroundColor: accentColor,
        },
        {
          label: "Edit",
          onPress: () => {
            router.push(`/list?id=${list.id}`)
          },
          backgroundColor: "#0ea5e9",
        },
      ]}
    >
      <ItemPressable
        className="flex-row p-4"
        onPress={() => navigation.navigate("ManageList", { id: list.id })}
      >
        <View className="size-16 overflow-hidden rounded-lg">
          {list.image ? (
            <Image source={{ uri: list.image }} resizeMode="cover" className="size-full" />
          ) : (
            <FallbackIcon title={list.title || ""} size="100%" textStyle={styles.title} />
          )}
        </View>
        <View className="ml-4 flex-1">
          <Text
            className="text-label text-lg font-semibold leading-tight"
            numberOfLines={1}
            ellipsizeMode="middle"
          >
            {title}
          </Text>
          {!!description && (
            <Text className="text-secondary-label text-base" numberOfLines={4}>
              {description}
            </Text>
          )}
          <View className="flex-row items-center gap-1">
            {!!views[list.view]?.icon &&
              createElement(views[list.view]!.icon, {
                color: views[list.view]!.activeColor,
                height: 16,
                width: 16,
              })}
            <Text className="text-secondary-label text-base">{views[list.view]?.name}</Text>
          </View>
        </View>

        <View
          className="bg-opaque-separator mx-4 h-full"
          style={{ width: StyleSheet.hairlineWidth }}
        />
        <View className="w-16 gap-1">
          <View className="flex-row items-center gap-1">
            <PowerIcon height={16} width={16} color={accentColor} />
            <Text className="text-secondary-label text-sm">{list.fee}</Text>
          </View>

          <View className="flex-row items-center gap-1">
            <UserAdd2CuteFiIcon height={16} width={16} color={accentColor} />
            <Text className="text-secondary-label text-sm">{listData?.subscriptionCount || 0}</Text>
          </View>

          {!!listData?.purchaseAmount && (
            <View className="flex-row items-center gap-1">
              <Wallet2CuteFiIcon height={16} width={16} color={accentColor} />
              <Balance className="text-secondary-label text-sm">
                {BigInt(listData.purchaseAmount)}
              </Balance>
            </View>
          )}
        </View>
      </ItemPressable>
    </SwipeableItem>
  )
}

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: "semibold",
  },
})

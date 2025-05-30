import { useOwnedLists, usePrefetchOwnedLists } from "@follow/store/list/hooks"
import type { ListModel } from "@follow/store/list/store"
import { createContext, createElement, use, useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { ListRenderItem } from "react-native"
import { Image, StyleSheet, Text, View } from "react-native"
import Animated, { LinearTransition } from "react-native-reanimated"
import { useColor, useColors } from "react-native-uikit-colors"

import { Balance } from "@/src/components/common/Balance"
import { UINavigationHeaderActionButton } from "@/src/components/layouts/header/NavigationHeader"
import {
  NavigationBlurEffectHeaderView,
  SafeNavigationScrollView,
} from "@/src/components/layouts/views/SafeNavigationScrollView"
import {
  GroupedInformationCell,
  GroupedInsetListCard,
} from "@/src/components/ui/grouped/GroupedList"
import { FallbackIcon } from "@/src/components/ui/icon/fallback-icon"
import { PlatformActivityIndicator } from "@/src/components/ui/loading/PlatformActivityIndicator"
import { ItemPressable } from "@/src/components/ui/pressable/ItemPressable"
import { views } from "@/src/constants/views"
import { AddCuteReIcon } from "@/src/icons/add_cute_re"
import { PowerIcon } from "@/src/icons/power"
import { RadaCuteFiIcon } from "@/src/icons/rada_cute_fi"
import { UserAdd2CuteFiIcon } from "@/src/icons/user_add_2_cute_fi"
import { Wallet2CuteFiIcon } from "@/src/icons/wallet_2_cute_fi"
import { useNavigation } from "@/src/lib/navigation/hooks"
import { ListScreen } from "@/src/screens/(modal)/ListScreen"
import { accentColor } from "@/src/theme/colors"

import { SwipeableGroupProvider, SwipeableItem } from "../../../components/common/SwipeableItem"
import { ManageListScreen } from "./ManageList"

const ListContext = createContext({} as Record<string, ListModel>)
export const ListsScreen = () => {
  const { t } = useTranslation("settings")
  const { isLoading, data } = usePrefetchOwnedLists()
  const lists = useOwnedLists()

  return (
    <SafeNavigationScrollView
      nestedScrollEnabled
      className="bg-system-grouped-background"
      Header={
        <NavigationBlurEffectHeaderView
          title={t("titles.lists")}
          headerRight={useCallback(
            () => (
              <AddListButton />
            ),
            [],
          )}
        />
      }
    >
      <View className="mt-6">
        <GroupedInsetListCard>
          <GroupedInformationCell
            title={t("titles.lists")}
            description={t("lists.info")}
            icon={<RadaCuteFiIcon height={40} width={40} color="#fff" />}
            iconBackgroundColor="#7DD3FC"
          />
        </GroupedInsetListCard>
      </View>
      <ListContext
        value={useMemo(
          () =>
            data?.reduce(
              (acc, list) => {
                acc[list.id] = list
                return acc
              },
              {} as Record<string, ListModel>,
            ) ?? {},
          [data],
        )}
      >
        <View className="mt-6">
          <GroupedInsetListCard showSeparator={false}>
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
                <PlatformActivityIndicator />
              </View>
            )}
          </GroupedInsetListCard>
        </View>
      </ListContext>
    </SafeNavigationScrollView>
  )
}

const AddListButton = () => {
  const labelColor = useColor("label")
  const navigation = useNavigation()
  return (
    <UINavigationHeaderActionButton
      onPress={() => {
        navigation.presentControllerView(ListScreen)
      }}
    >
      <AddCuteReIcon height={20} width={20} color={labelColor} />
    </UINavigationHeaderActionButton>
  )
}

const ItemSeparatorComponent = () => {
  return (
    <View
      className="bg-opaque-separator/50 ml-24 h-px flex-1"
      collapsable={false}
      style={{ transform: [{ scaleY: 0.5 }] }}
    />
  )
}

const keyExtractor = (item: ListModel) => item.id

const ListItemCell: ListRenderItem<ListModel> = (props) => {
  return <ListItemCellImpl {...props} />
}
const ListItemCellImpl: ListRenderItem<ListModel> = ({ item: list }) => {
  const { t } = useTranslation("common")
  const { title, description } = list
  const listData = use(ListContext)[list.id]

  const navigation = useNavigation()
  const colors = useColors()

  return (
    <SwipeableItem
      swipeRightToCallAction
      rightActions={[
        {
          label: t("words.manage"),
          onPress: () => {
            navigation.pushControllerView(ManageListScreen, { id: list.id })
          },
          backgroundColor: accentColor,
        },
        {
          label: t("words.edit"),
          onPress: () => {
            navigation.presentControllerView(ListScreen, { listId: list.id })
          },
          backgroundColor: colors.blue,
        },
      ]}
    >
      <ItemPressable
        className="flex-row p-4"
        onPress={() => navigation.pushControllerView(ManageListScreen, { id: list.id })}
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
            {!!views[list.view]?.name && (
              <Text className="text-secondary-label text-base">{t(views[list.view]!.name)}</Text>
            )}
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

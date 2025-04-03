import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import type { ListRenderItem } from "react-native"
import { Text, View } from "react-native"
import Animated, { LinearTransition } from "react-native-reanimated"
import { useColors } from "react-native-uikit-colors"

import { SwipeableGroupProvider, SwipeableItem } from "@/src/components/common/SwipeableItem"
import { HeaderSubmitTextButton } from "@/src/components/layouts/header/HeaderElements"
import {
  NavigationBlurEffectHeader,
  SafeNavigationScrollView,
} from "@/src/components/layouts/views/SafeNavigationScrollView"
import {
  GroupedInformationCell,
  GroupedInsetListCard,
  GroupedPlainButtonCell,
} from "@/src/components/ui/grouped/GroupedList"
import { PlatformActivityIndicator } from "@/src/components/ui/loading/PlatformActivityIndicator"
import { ItemPressable } from "@/src/components/ui/pressable/ItemPressable"
import { Switch } from "@/src/components/ui/switch/Switch"
import { Magic2CuteFiIcon } from "@/src/icons/magic_2_cute_fi"
import { useNavigation } from "@/src/lib/navigation/hooks"
import {
  useActionRules,
  useIsActionDataDirty,
  usePrefetchActions,
  useUpdateActionsMutation,
} from "@/src/store/action/hooks"
import { actionActions } from "@/src/store/action/store"
import type { ActionRule } from "@/src/store/action/types"

import { EditRuleScreen } from "./EditRule"

export const ActionsScreen = () => {
  const { t } = useTranslation("settings")
  const { isLoading } = usePrefetchActions()
  const rules = useActionRules()
  const isDirty = useIsActionDataDirty()

  return (
    <SafeNavigationScrollView nestedScrollEnabled className="bg-system-grouped-background">
      <NavigationBlurEffectHeader
        title={t("titles.actions")}
        headerRight={useCallback(
          () => (
            <SaveRuleButton disabled={!isDirty} />
          ),
          [isDirty],
        )}
        promptBeforeLeave={isDirty}
      />

      <View className="mt-6">
        <GroupedInsetListCard>
          <GroupedInformationCell
            title={t("titles.actions")}
            description={t("actions.info")}
            icon={<Magic2CuteFiIcon height={40} width={40} color="#fff" />}
            iconBackgroundColor="#059669"
          />
        </GroupedInsetListCard>
      </View>

      <View className="mt-6">
        <GroupedInsetListCard>
          {rules.length > 0 ? (
            <SwipeableGroupProvider>
              <Animated.FlatList
                keyExtractor={keyExtractor}
                itemLayoutAnimation={LinearTransition}
                scrollEnabled={false}
                data={rules}
                renderItem={ListItemCell}
                ItemSeparatorComponent={ItemSeparatorComponent}
              />
            </SwipeableGroupProvider>
          ) : isLoading && rules.length === 0 ? (
            <View className="my-4">
              <PlatformActivityIndicator />
            </View>
          ) : null}
        </GroupedInsetListCard>
        <NewRuleButton />
      </View>
    </SafeNavigationScrollView>
  )
}

const NewRuleButton = () => {
  const { t } = useTranslation("settings")
  return (
    <GroupedInsetListCard className="mt-6">
      <GroupedPlainButtonCell
        label={t("actions.newRule")}
        onPress={() => {
          actionActions.addRule()
        }}
      />
    </GroupedInsetListCard>
  )
}

const SaveRuleButton = ({ disabled }: { disabled?: boolean }) => {
  const { mutate, isPending } = useUpdateActionsMutation()

  return (
    <HeaderSubmitTextButton
      label="Save"
      isValid={!disabled}
      onPress={mutate}
      isLoading={isPending}
    />
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

const keyExtractor = (item: ActionRule) => item.index.toString()
const ListItemCell: ListRenderItem<ActionRule> = (props) => {
  return <ListItemCellImpl {...props} />
}
const ListItemCellImpl: ListRenderItem<ActionRule> = ({ item: rule }) => {
  const { t } = useTranslation("common")
  const navigation = useNavigation()
  const colors = useColors()

  return (
    <SwipeableItem
      swipeRightToCallAction
      rightActions={[
        {
          label: t("words.delete"),
          onPress: () => {
            actionActions.deleteRule(rule.index)
          },
          backgroundColor: colors.red,
        },
        {
          label: t("words.edit"),
          onPress: () => {
            navigation.pushControllerView(EditRuleScreen, {
              index: rule.index,
            })
          },
          backgroundColor: colors.blue,
        },
      ]}
    >
      <ItemPressable
        className="flex flex-row justify-between p-4"
        onPress={() => navigation.pushControllerView(EditRuleScreen, { index: rule.index })}
      >
        <Text className="text-label text-base">{rule.name}</Text>
        <Switch
          size="sm"
          value={!rule.result.disabled}
          onValueChange={() => {
            actionActions.patchRule(rule.index, {
              result: {
                disabled: !rule.result.disabled,
              },
            })
          }}
        />
      </ItemPressable>
    </SwipeableItem>
  )
}

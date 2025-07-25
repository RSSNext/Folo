import type { ActionModel } from "@follow/models/types"
import {
  useActionRules,
  useIsActionDataDirty,
  usePrefetchActions,
  useUpdateActionsMutation,
} from "@follow/store/action/hooks"
import { actionActions } from "@follow/store/action/store"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import type { ListRenderItem } from "react-native"
import { View } from "react-native"
import Animated, { LinearTransition } from "react-native-reanimated"
import { useColors } from "react-native-uikit-colors"

import { Link } from "@/src/components/common/Link"
import { SwipeableGroupProvider, SwipeableItem } from "@/src/components/common/SwipeableItem"
import { HeaderSubmitTextButton } from "@/src/components/layouts/header/HeaderElements"
import {
  NavigationBlurEffectHeaderView,
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
import { Text } from "@/src/components/ui/typography/Text"
import { Book6CuteReIcon } from "@/src/icons/book_6_cute_re"
import { Magic2CuteFiIcon } from "@/src/icons/magic_2_cute_fi"
import { useNavigation } from "@/src/lib/navigation/hooks"
import { toast } from "@/src/lib/toast"
import { accentColor } from "@/src/theme/colors"

import { EditRuleScreen } from "./EditRule"

export const ActionsScreen = () => {
  const { t } = useTranslation("settings")
  const { t: tCommon } = useTranslation("common")
  const { isLoading } = usePrefetchActions()
  const rules = useActionRules()
  const isDirty = useIsActionDataDirty()
  return (
    <SafeNavigationScrollView
      Header={
        <NavigationBlurEffectHeaderView
          title={t("titles.actions")}
          headerRight={useCallback(
            () => (
              <SaveRuleButton disabled={!isDirty} />
            ),
            [isDirty],
          )}
          promptBeforeLeave={isDirty}
        />
      }
      nestedScrollEnabled
      className="bg-system-grouped-background"
    >
      <View className="mt-6">
        <GroupedInsetListCard>
          <GroupedInformationCell
            title={t("titles.actions")}
            description={t("actions.info")}
            icon={<Magic2CuteFiIcon height={40} width={40} color="#fff" />}
            iconBackgroundColor="#9333EA"
          >
            <Link
              className="text-accent border-accent center mt-4 w-44 rounded-full border py-0.5"
              href="https://github.com/RSSNext/Folo/wiki/Actions"
            >
              <View className="flex w-full flex-row items-center justify-center gap-1">
                <Book6CuteReIcon color={accentColor} width={16} height={16} />
                <Text className="text-accent">{tCommon("words.documentation")}</Text>
              </View>
            </Link>
          </GroupedInformationCell>
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
          actionActions.addRule((number) =>
            t("actions.actionName", {
              number,
            }),
          )
        }}
      />
    </GroupedInsetListCard>
  )
}
const SaveRuleButton = ({ disabled }: { disabled?: boolean }) => {
  const navigation = useNavigation()
  const { mutate, isPending } = useUpdateActionsMutation({
    onSuccess() {
      navigation.back()
      toast.success("Actions saved")
    },
    onError(errorMessage) {
      toast.error(errorMessage)
    },
  })
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
      className="bg-opaque-separator/70 ml-24 h-px flex-1"
      collapsable={false}
      style={{
        transform: [
          {
            scaleY: 0.5,
          },
        ],
      }}
    />
  )
}
const keyExtractor = (item: ActionModel) => item.index.toString()
const ListItemCell: ListRenderItem<ActionModel> = (props) => {
  return <ListItemCellImpl {...props} />
}
const ListItemCellImpl: ListRenderItem<ActionModel> = ({ item: rule }) => {
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
        onPress={() =>
          navigation.pushControllerView(EditRuleScreen, {
            index: rule.index,
          })
        }
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

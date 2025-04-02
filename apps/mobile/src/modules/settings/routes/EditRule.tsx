import { useTranslation } from "react-i18next"
import { Text, View } from "react-native"
import * as DropdownMenu from "zeego/dropdown-menu"

import { SwipeableItem } from "@/src/components/common/SwipeableItem"
import {
  NavigationBlurEffectHeader,
  SafeNavigationScrollView,
} from "@/src/components/layouts/views/SafeNavigationScrollView"
import { PlainTextField } from "@/src/components/ui/form/TextField"
import {
  GroupedInsetListActionCell,
  GroupedInsetListActionCellRadio,
  GroupedInsetListCard,
  GroupedInsetListCell,
  GroupedInsetListSectionHeader,
  GroupedPlainButtonCell,
} from "@/src/components/ui/grouped/GroupedList"
import { views } from "@/src/constants/views"
import { useNavigation } from "@/src/lib/navigation/hooks"
import type { NavigationControllerView } from "@/src/lib/navigation/types"
import { useActionRule } from "@/src/store/action/hooks"
import { actionActions } from "@/src/store/action/store"
import type { ActionFilter, ActionRule } from "@/src/store/action/types"
import { accentColor, useColors } from "@/src/theme/colors"

import { availableActionList, filterFieldOptions, filterOperatorOptions } from "../actions/constant"
import { EditConditionScreen } from "./EditCondition"

export const EditRuleScreen: NavigationControllerView<{ index: number }> = ({ index }) => {
  const { t } = useTranslation("settings")
  const rule = useActionRule(index)

  return (
    <SafeNavigationScrollView
      className="bg-system-grouped-background"
      contentContainerClassName="mt-6"
    >
      <NavigationBlurEffectHeader
        title={`${t("actions.edit_rule")}${rule?.name ? ` - ${rule.name}` : ""}`}
      />
      <RuleImpl index={index} />
    </SafeNavigationScrollView>
  )
}

const RuleImpl: React.FC<{ index: number }> = ({ index }) => {
  const rule = useActionRule(index)

  if (!rule) {
    return <Text>No rule available</Text>
  }

  return (
    <View className="gap-6">
      <NameSection rule={rule} />
      <FilterSection rule={rule} />
      <ConditionSection filter={rule.condition as any} index={rule.index} />
      <ActionSection rule={rule} />
      {__DEV__ && (
        <View className="mx-6">
          <Text className="text-label">{JSON.stringify(rule, null, 2)}</Text>
        </View>
      )}
    </View>
  )
}

const NameSection: React.FC<{ rule: ActionRule }> = ({ rule }) => {
  const { t } = useTranslation("settings")
  return (
    <GroupedInsetListCard>
      <GroupedInsetListCell
        label={t("actions.action_card.name")}
        leftClassName="flex-none"
        rightClassName="flex-1"
      >
        <View className="flex-1">
          <PlainTextField
            className="text-secondary-label w-full flex-1 text-right"
            value={rule.name}
            hitSlop={10}
            selectionColor={accentColor}
            onChangeText={(text) => {
              actionActions.patchRule(rule.index, { name: text })
            }}
          />
        </View>
      </GroupedInsetListCell>
    </GroupedInsetListCard>
  )
}

const FilterSection: React.FC<{ rule: ActionRule }> = ({ rule }) => {
  const { t } = useTranslation("settings")
  const hasCustomFilters = rule.condition.length > 0
  return (
    <View>
      <GroupedInsetListSectionHeader
        label={t("actions.action_card.when_feeds_match")}
        marginSize="small"
      />
      <GroupedInsetListCard>
        <GroupedInsetListActionCellRadio
          label={t("actions.action_card.all")}
          selected={!hasCustomFilters}
          onPress={() => {
            actionActions.toggleRuleFilter(rule.index)
          }}
        />
        <GroupedInsetListActionCellRadio
          label={t("actions.action_card.custom_filters")}
          selected={hasCustomFilters}
          onPress={() => {
            actionActions.toggleRuleFilter(rule.index)
          }}
        />
      </GroupedInsetListCard>
    </View>
  )
}

const ConditionSection: React.FC<{ filter: ActionFilter; index: number }> = ({ filter, index }) => {
  const { t } = useTranslation("settings")
  const { t: tCommon } = useTranslation("common")
  const navigation = useNavigation()
  const colors = useColors()

  if (filter.length === 0) return null
  return (
    <View>
      <GroupedInsetListSectionHeader label={t("actions.conditions")} marginSize="small" />

      {filter.map((group, groupIndex) => {
        if (!Array.isArray(group)) {
          group = [group]
        }
        return (
          <GroupedInsetListCard key={groupIndex} className="mb-6">
            {group.map((item, itemIndex) => {
              const currentField = filterFieldOptions.find((field) => field.value === item.field)
              const currentOperator = filterOperatorOptions.find(
                (field) => field.value === item.operator,
              )
              const currentValue =
                currentField?.type === "view"
                  ? tCommon(views.find((view) => view.view === Number(item.value))?.name!)
                  : item.value
              return (
                <SwipeableItem
                  key={`${groupIndex}-${itemIndex}-${item.field}-${item.operator}-${item.value}`}
                  swipeRightToCallAction
                  rightActions={[
                    {
                      label: tCommon("words.delete"),
                      onPress: () => {
                        actionActions.deleteConditionItem({
                          ruleIndex: index,
                          groupIndex,
                          conditionIndex: itemIndex,
                        })
                      },
                      backgroundColor: colors.red,
                    },
                    {
                      label: tCommon("words.edit"),
                      onPress: () => {
                        navigation.pushControllerView(EditConditionScreen, {
                          ruleIndex: index,
                          groupIndex,
                          conditionIndex: itemIndex,
                        })
                      },
                      backgroundColor: colors.blue,
                    },
                  ]}
                >
                  <GroupedInsetListActionCell
                    label={
                      [
                        currentField?.label ? t(currentField.label) : "",
                        currentOperator?.label ? t(currentOperator.label) : "",
                        currentValue,
                      ]
                        .filter(Boolean)
                        .join(" ") || "Unknown"
                    }
                    onPress={() => {
                      navigation.pushControllerView(EditConditionScreen, {
                        ruleIndex: index,
                        groupIndex,
                        conditionIndex: itemIndex,
                      })
                    }}
                  />
                </SwipeableItem>
              )
            })}
            <GroupedPlainButtonCell
              label={t("actions.action_card.and")}
              onPress={() => {
                actionActions.addConditionItem({ ruleIndex: index, groupIndex })
                setTimeout(() => {
                  navigation.pushControllerView(EditConditionScreen, {
                    ruleIndex: index,
                    groupIndex,
                    conditionIndex: group.length,
                  })
                }, 0)
              }}
            />
          </GroupedInsetListCard>
        )
      })}
      <GroupedInsetListCard>
        <GroupedPlainButtonCell
          label={t("actions.action_card.or")}
          onPress={() => {
            actionActions.addConditionGroup({ ruleIndex: index })
          }}
        />
      </GroupedInsetListCard>
    </View>
  )
}

const ActionSection: React.FC<{ rule: ActionRule }> = ({ rule }) => {
  const { t } = useTranslation("settings")
  const enabledActions = availableActionList.filter(
    (action) => rule.result[action.value] !== undefined,
  )
  const notEnabledActions = availableActionList.filter(
    (action) => rule.result[action.value] === undefined,
  )

  const navigation = useNavigation()
  const colors = useColors()

  return (
    <View>
      <GroupedInsetListSectionHeader label={t("actions.action_card.then_do")} marginSize="small" />
      <GroupedInsetListCard>
        {enabledActions.map((action) => (
          <SwipeableItem
            key={action.value}
            rightActions={[
              {
                label: t("words.delete", { ns: "common" }),
                onPress: () => {
                  actionActions.deleteRuleAction(rule.index, action.value)
                },
                backgroundColor: colors.red,
              },
            ]}
          >
            {action.component ? (
              <action.component rule={rule} />
            ) : action.onNavigate ? (
              <GroupedInsetListActionCell
                label={t(action.label)}
                onPress={() => action.onNavigate?.(navigation, rule.index)}
              />
            ) : (
              <GroupedInsetListCell
                label={t(action.label)}
                leftClassName="flex-none"
                rightClassName="flex-1 flex-row justify-end"
              />
            )}
          </SwipeableItem>
        ))}
        {notEnabledActions.length > 0 && (
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <GroupedPlainButtonCell label={t("actions.action_card.add")} />
            </DropdownMenu.Trigger>
            <DropdownMenu.Content>
              {notEnabledActions.map((action) => (
                <DropdownMenu.Item
                  key={action.value}
                  onSelect={() => {
                    if (action.onEnable) {
                      action.onEnable(rule.index)
                    } else {
                      actionActions.patchRule(rule.index, { result: { [action.value]: true } })
                    }
                  }}
                >
                  <DropdownMenu.ItemTitle>{t(action.label)}</DropdownMenu.ItemTitle>
                </DropdownMenu.Item>
              ))}
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        )}
      </GroupedInsetListCard>
    </View>
  )
}

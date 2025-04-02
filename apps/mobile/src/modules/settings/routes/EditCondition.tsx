import { useTranslation } from "react-i18next"
import { Text, View } from "react-native"

import {
  NavigationBlurEffectHeader,
  SafeNavigationScrollView,
} from "@/src/components/layouts/views/SafeNavigationScrollView"
import { Select } from "@/src/components/ui/form/Select"
import { PlainTextField } from "@/src/components/ui/form/TextField"
import {
  GroupedInsetListBaseCell,
  GroupedInsetListCard,
  GroupedInsetListSectionHeader,
} from "@/src/components/ui/grouped/GroupedList"
import { views } from "@/src/constants/views"
import type { NavigationControllerView } from "@/src/lib/navigation/types"
import { useActionRuleCondition } from "@/src/store/action/hooks"
import { actionActions } from "@/src/store/action/store"
import type { ConditionIndex } from "@/src/store/action/types"
import { accentColor } from "@/src/theme/colors"

import { filterFieldOptions, filterOperatorOptions } from "../actions/constant"

export const EditConditionScreen: NavigationControllerView<{
  ruleIndex: number
  groupIndex: number
  conditionIndex: number
}> = (params) => {
  const { t } = useTranslation("settings")
  return (
    <SafeNavigationScrollView className="bg-system-grouped-background">
      <NavigationBlurEffectHeader title={t("actions.edit_condition")} />

      <ConditionForm index={params} />
    </SafeNavigationScrollView>
  )
}

function ConditionForm({ index }: { index: ConditionIndex }) {
  const { t } = useTranslation("settings")
  const item = useActionRuleCondition(index)!
  const currentField = filterFieldOptions.find((field) => field.value === item.field)
  const currentOperator = filterOperatorOptions.find((field) => field.value === item.operator)
  const currentView =
    currentField?.type === "view"
      ? views.find((view) => view.view === Number(item.value))
      : undefined
  const { t: tCommon } = useTranslation("common")

  return (
    <>
      <GroupedInsetListSectionHeader label={t("actions.condition")} />
      <GroupedInsetListCard>
        <GroupedInsetListBaseCell className="flex flex-row justify-between">
          <Text className="text-label">{t("actions.action_card.field")}</Text>
          <Select
            options={filterFieldOptions.map((i) => ({ ...i, label: t(i.label) }))}
            value={currentField?.value}
            onValueChange={(value) => {
              actionActions.pathCondition(index, {
                field: value as any,
              })
            }}
            wrapperClassName="min-w-48"
          />
        </GroupedInsetListBaseCell>

        <GroupedInsetListBaseCell className="flex flex-row justify-between">
          <Text className="text-label">{t("actions.action_card.operator")}</Text>
          <Select
            options={filterOperatorOptions
              .map((i) => ({ ...i, label: t(i.label) }))
              .filter((operator) => operator.types.includes(currentField?.type ?? "text"))}
            value={currentOperator?.value}
            onValueChange={(value) => {
              actionActions.pathCondition(index, {
                operator: value as any,
              })
            }}
            wrapperClassName="min-w-44"
          />
        </GroupedInsetListBaseCell>

        <GroupedInsetListBaseCell className="flex flex-row justify-between">
          <Text className="text-label">{t("actions.action_card.value")}</Text>
          {currentField?.type === "view" ? (
            <Select
              options={views.map((field) => ({
                label: tCommon(field.name),
                value: String(field.view),
              }))}
              value={currentView?.view ? String(currentView.view) : undefined}
              onValueChange={(val) => {
                actionActions.pathCondition(index, { value: val })
              }}
              wrapperClassName="min-w-40"
            />
          ) : (
            <PlainTextField
              className="w-full flex-1 text-right"
              value={item.value}
              onChangeText={(value) => {
                actionActions.pathCondition(index, { value })
              }}
              hitSlop={10}
              selectionColor={accentColor}
              placeholder="Enter value"
            />
          )}
        </GroupedInsetListBaseCell>
      </GroupedInsetListCard>
      {__DEV__ && (
        <View className="m-5">
          <Text className="text-label">{JSON.stringify(item)}</Text>
        </View>
      )}
    </>
  )
}

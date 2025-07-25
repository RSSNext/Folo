import type { ActionConditionIndex } from "@follow/models/types"
import { filterFieldOptions, filterOperatorOptions } from "@follow/store/action/constant"
import { useActionRuleCondition } from "@follow/store/action/hooks"
import { actionActions } from "@follow/store/action/store"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { View } from "react-native"

import {
  NavigationBlurEffectHeaderView,
  SafeNavigationScrollView,
} from "@/src/components/layouts/views/SafeNavigationScrollView"
import { Select } from "@/src/components/ui/form/Select"
import { PlainTextField } from "@/src/components/ui/form/TextField"
import {
  GroupedInsetListBaseCell,
  GroupedInsetListCard,
  GroupedInsetListSectionHeader,
} from "@/src/components/ui/grouped/GroupedList"
import { Text } from "@/src/components/ui/typography/Text"
import { views } from "@/src/constants/views"
import type { NavigationControllerView } from "@/src/lib/navigation/types"
import { accentColor } from "@/src/theme/colors"

export const EditConditionScreen: NavigationControllerView<{
  ruleIndex: number
  groupIndex: number
  conditionIndex: number
}> = (params) => {
  const { t } = useTranslation("settings")
  return (
    <SafeNavigationScrollView
      className="bg-system-grouped-background"
      Header={<NavigationBlurEffectHeaderView title={t("actions.edit_condition")} />}
    >
      <ConditionForm index={params} />
    </SafeNavigationScrollView>
  )
}
function ConditionForm({ index }: { index: ActionConditionIndex }) {
  const { t } = useTranslation("settings")
  const item = useActionRuleCondition(index)!
  const currentField = filterFieldOptions.find((field) => field.value === item.field)
  const currentOperator = filterOperatorOptions.find((field) => field.value === item.operator)
  const currentView =
    currentField?.type === "view"
      ? views.find((view) => view.view === Number(item.value))
      : undefined
  const operatorOptions = useMemo(() => {
    return filterOperatorOptions
      .map((i) => ({
        ...i,
        label: t(i.label),
      }))
      .filter((operator) => operator.types.includes(currentField?.type ?? "text"))
  }, [t, currentField])
  if (operatorOptions.length === 1 && currentOperator?.value !== operatorOptions[0]!.value) {
    actionActions.pathCondition(index, {
      operator: operatorOptions[0]!.value as any,
    })
  }
  return (
    <>
      <GroupedInsetListSectionHeader label={t("actions.condition")} />
      <GroupedInsetListCard>
        <GroupedInsetListBaseCell className="flex flex-row justify-between">
          <Text className="text-label">{t("actions.action_card.field")}</Text>
          <Select
            options={filterFieldOptions.map((i) => ({
              ...i,
              label: t(i.label),
            }))}
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
            options={operatorOptions}
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
          <ValueField
            type={currentField?.type ?? "text"}
            value={
              currentField?.type === "view"
                ? currentView?.view !== undefined
                  ? String(currentView.view)
                  : undefined
                : item.value
            }
            onChange={(value) => {
              actionActions.pathCondition(index, {
                value,
              })
            }}
          />
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
function ValueField({
  type,
  value,
  onChange,
}: {
  type: string
  value?: string
  onChange: (value: string | undefined) => void
}) {
  const { t } = useTranslation("common")
  switch (type) {
    case "view": {
      return (
        <Select
          options={views.map((field) => ({
            label: t(field.name),
            value: String(field.view),
          }))}
          value={value}
          onValueChange={(val) => {
            onChange(val)
          }}
          wrapperClassName="min-w-40"
        />
      )
    }
    case "status": {
      if (value === undefined) {
        onChange("collected")
      }
      return (
        <Select
          options={[
            {
              label: t("words.starred"),
              value: "collected",
            },
          ]}
          value={value}
          onValueChange={(val) => {
            onChange(val as string)
          }}
          wrapperClassName="min-w-40"
        />
      )
    }
    default: {
      return (
        <PlainTextField
          className="w-full flex-1 text-right"
          value={value}
          onChangeText={(value) => {
            onChange(value)
          }}
          hitSlop={10}
          selectionColor={accentColor}
          placeholder="Enter value"
        />
      )
    }
  }
}

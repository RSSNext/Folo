import { filterFieldOptions, filterOperatorOptions } from "@follow/store/action/constant"
import type { ActionItem } from "@follow/store/action/store"
import type { TFunction } from "i18next"

import { availableActionMap } from "./constants"

const fieldLabelMap = new Map(filterFieldOptions.map((option) => [option.value, option.label]))
const operatorLabelMap = new Map(
  filterOperatorOptions.map((option) => [option.value, option.label]),
)

export const getRuleDisplayName = (
  rule: ActionItem | undefined,
  index: number,
  t: TFunction<"settings">,
) => {
  const fallback = t("actions.actionName", { number: index + 1 })
  if (!rule) return fallback
  const trimmedName = rule.name?.trim()
  return trimmedName && trimmedName.length > 0 ? trimmedName : fallback
}

export const buildConditionSummary = (rule: ActionItem | undefined, t: TFunction<"settings">) => {
  if (!rule || rule.condition.length === 0) {
    return t("actions.action_card.all")
  }

  const andSeparator = ` ${t("actions.action_card.and")} `
  const orSeparator = ` ${t("actions.action_card.or")} `

  const groups = rule.condition
    .map((group) => {
      const groupParts = group
        .map((condition) => {
          const fieldLabelKey = condition.field ? fieldLabelMap.get(condition.field) : undefined
          const operatorLabelKey = condition.operator
            ? operatorLabelMap.get(condition.operator)
            : undefined
          const fieldLabel = fieldLabelKey ? t(fieldLabelKey) : undefined
          const operatorLabel = operatorLabelKey ? t(operatorLabelKey) : undefined
          const { value } = condition

          const valueText =
            typeof value === "string" && value.trim().length > 0 ? value : value?.toString() || ""

          const parts = [fieldLabel, operatorLabel, valueText].filter(Boolean)
          return parts.join(" ")
        })
        .filter((part) => part.length > 0)

      return groupParts.join(andSeparator)
    })
    .filter((group) => group.length > 0)

  if (groups.length === 0) {
    return t("actions.action_card.all")
  }

  return groups.join(orSeparator)
}

export const buildActionSummary = (rule: ActionItem | undefined, t: TFunction<"settings">) => {
  if (!rule) {
    return t("actions.action_card.summary.no_actions")
  }

  if (rule.result?.disabled) {
    return t("actions.action_card.summary.disabled")
  }

  const labels = Object.values(availableActionMap)
    .filter((action) => {
      const value = rule.result?.[action.value as keyof typeof rule.result]
      if (Array.isArray(value)) {
        return value.length > 0
      }

      if (typeof value === "object" && value !== null) {
        return Object.keys(value).length > 0
      }

      return Boolean(value)
    })
    .map((action) => t(action.label))

  if (labels.length === 0) {
    return t("actions.action_card.summary.no_actions")
  }

  return labels.join(" + ")
}

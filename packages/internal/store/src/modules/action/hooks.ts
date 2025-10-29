import type { ActionConditionIndex } from "@follow-app/client-sdk"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useCallback } from "react"

import type { GeneralMutationOptions } from "../../types"
import type { ActionItem } from "./store"
import { actionActions, actionSyncService, useActionStore } from "./store"

export const usePrefetchActions = () => {
  return useQuery({
    queryKey: ["action", "rules"],
    queryFn: () => actionSyncService.fetchRules(),
  })
}

export const useUpdateActionsMutation = (options?: GeneralMutationOptions) => {
  return useMutation({
    ...options,
    mutationFn: () => actionSyncService.saveRules(),
  })
}

export function useActionRules(): ActionItem[]
export function useActionRules<T>(selector: (rules: ActionItem[]) => T): T
export function useActionRules<T>(selector?: (rules: ActionItem[]) => T) {
  return useActionStore((state) => {
    const { rules } = state
    return selector ? selector(rules) : rules
  })
}

export function useActionRule(index: number): ActionItem | undefined
export function useActionRule<T>(index: number, selector: (rule: ActionItem) => T): T
export function useActionRule<T>(index: number, selector?: (rule: ActionItem) => T) {
  return useActionStore((state) => {
    const rule = state.rules[index]
    if (!rule) return
    return selector ? selector(rule) : rule
  })
}

export function useActionRuleCondition({
  ruleIndex,
  groupIndex,
  conditionIndex,
}: ActionConditionIndex) {
  return useActionStore(
    useCallback(
      (state) => state.rules[ruleIndex]?.condition[groupIndex]?.[conditionIndex],
      [ruleIndex, groupIndex, conditionIndex],
    ),
  )
}

export const useIsActionDataDirty = () => {
  return useActionStore((state) => state.isDirty)
}

export const useHasNotificationActions = () => {
  return useActionStore((state) => {
    return state.rules.some((rule) => !!rule.result.newEntryNotification && !rule.result.disabled)
  })
}

export const useActionImportExport = () => {
  return {
    exportRules: () => actionActions.exportRules(),
    importRules: (jsonData: string) => actionActions.importRules(jsonData),
  }
}

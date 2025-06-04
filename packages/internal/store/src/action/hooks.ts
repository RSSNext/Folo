import type { ActionConditionIndex, ActionModel, ActionRules } from "@follow/models/types"
import { useMutation, useQuery } from "@tanstack/react-query"
import { FetchError } from "ofetch"
import { useCallback } from "react"

import type { GeneralMutationOptions } from "../types"
import { actionSyncService, useActionStore } from "./store"

export const usePrefetchActions = () => {
  return useQuery({
    queryKey: ["action", "rules"],
    queryFn: () => actionSyncService.fetchRules(),
  })
}

export const useUpdateActionsMutation = (options?: GeneralMutationOptions) => {
  return useMutation({
    mutationFn: () => actionSyncService.saveRules(),
    onSuccess() {
      options?.onSuccess?.()
    },
    onError(err) {
      if (err instanceof FetchError && err.response?._data) {
        const { message } = err.response._data
        options?.onError?.(message)
        return
      }

      options?.onError?.("Error saving actions")
    },
  })
}

export function useActionRules(): ActionRules
export function useActionRules<T>(selector: (rules: ActionRules) => T): T
export function useActionRules<T>(selector?: (rules: ActionRules) => T) {
  return useActionStore((state) => {
    const { rules } = state
    return selector ? selector(rules) : rules
  })
}

export function useActionRule(index: number): ActionModel | undefined
export function useActionRule<T>(index: number, selector: (rule: ActionModel) => T): T
export function useActionRule<T>(index: number, selector?: (rule: ActionModel) => T) {
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

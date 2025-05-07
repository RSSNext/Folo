import { useMutation, useQuery } from "@tanstack/react-query"
import { FetchError } from "ofetch"
import { useCallback } from "react"

import { useNavigation } from "@/src/lib/navigation/hooks"
import { toast } from "@/src/lib/toast"

import { actionSyncService, useActionStore } from "./store"

export const usePrefetchActions = () => {
  return useQuery({
    queryKey: ["action", "rules"],
    queryFn: () => actionSyncService.fetchRules(),
  })
}

export const useUpdateActionsMutation = () => {
  const navigation = useNavigation()
  return useMutation({
    mutationFn: () => actionSyncService.saveRules(),
    onSuccess() {
      navigation.back()
      toast.success("Actions saved")
    },
    onError(err) {
      if (err instanceof FetchError && err.response?._data) {
        const { message } = err.response._data
        toast.error(message)
        return
      }

      toast.error("Error saving actions")
    },
  })
}

export const useActionRules = () => {
  return useActionStore((state) => state.rules)
}

export const useActionRule = (index?: number) => {
  return useActionStore(
    useCallback((state) => (index !== undefined ? state.rules[index] : undefined), [index]),
  )
}

export function useActionRuleCondition({
  ruleIndex,
  groupIndex,
  conditionIndex,
}: {
  ruleIndex: number
  groupIndex: number
  conditionIndex: number
}) {
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

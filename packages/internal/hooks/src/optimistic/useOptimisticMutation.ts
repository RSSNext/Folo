import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import type { OptimisticContext, OptimisticItem, OptimisticMutationConfig } from "./types"

/**
 * Generic optimistic update mutation hook
 * Provides automatic optimistic updates with error rollback for any mutation
 */
export function useOptimisticMutation<
  TData extends OptimisticItem,
  TVariables,
  TResponse = any,
  TContext = OptimisticContext,
>(config: OptimisticMutationConfig<TData, TVariables, TResponse, TContext>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: config.mutationFn,

    onMutate: async (variables: TVariables) => {
      // Cancel any outgoing queries to prevent race conditions
      await queryClient.cancelQueries({ queryKey: config.queryKey })

      // Get previous data for rollback
      const previousData = queryClient.getQueryData<TData[]>(config.queryKey) || []

      // Execute optimistic update
      const { newData, rollbackData, tempId } = config.optimisticUpdater(variables, previousData)

      // Update query cache with optimistic data
      queryClient.setQueryData(config.queryKey, newData)

      return {
        rollbackData,
        tempId,
        previousData,
        variables,
      } as TContext
    },

    onSuccess: async (result, variables, context) => {
      // Apply success updater if provided, otherwise invalidate queries
      if (config.successUpdater) {
        const currentData = queryClient.getQueryData<TData[]>(config.queryKey) || []
        const updatedData = config.successUpdater(result, variables, currentData, context)
        queryClient.setQueryData(config.queryKey, updatedData)
      }

      // Execute custom success callback
      await config.onSuccess?.(result, variables)
    },

    onError: (error, _variables, context: TContext | undefined) => {
      // Rollback to previous state
      const rollbackData = (context as any)?.rollbackData
      if (rollbackData) {
        queryClient.setQueryData(config.queryKey, rollbackData)
      }

      // Show error toast if configured
      if (config.errorConfig?.showToast !== false) {
        const message = config.errorConfig?.customMessage || "Operation failed"
        toast.error(message)
      }

      console.error("Optimistic mutation failed:", error)
    },

    onSettled: () => {
      // Ensure eventual consistency by invalidating queries
      queryClient.invalidateQueries({ queryKey: config.queryKey })
    },

    // Configure retry behavior
    retry: config.errorConfig?.retryable ? (config.errorConfig.maxRetries ?? 2) : false,

    retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(2, attemptIndex), 5000),
  })
}

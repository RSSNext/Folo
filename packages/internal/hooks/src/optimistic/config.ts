import type { MutationFunction, QueryKey } from "@tanstack/react-query"

import { optimisticStrategies } from "./strategies"
import type { OptimisticItem, OptimisticKey, OptimisticMutationConfig } from "./types"

/**
 * Configuration builders for common optimistic update patterns
 * These provide type-safe, pre-configured optimistic mutation setups
 */
export const createOptimisticConfig = {
  /**
   * Configuration for create operations
   * Adds new items to the beginning of the list
   */
  forCreate: <TData extends OptimisticItem, TVariables, TResponse = any>(config: {
    mutationFn: MutationFunction<TResponse, TVariables>
    queryKey: QueryKey
    generateOptimistic: (variables: TVariables) => Omit<TData, "id" | OptimisticKey | "updatedAt">
    onSuccess?: (result: TResponse, variables: TVariables) => void | Promise<void>
    errorMessage?: string
    retryable?: boolean
    maxRetries?: number
  }): OptimisticMutationConfig<TData, TVariables, TResponse> => ({
    mutationFn: config.mutationFn,
    queryKey: config.queryKey,
    onSuccess: config.onSuccess,
    ...optimisticStrategies.create<TData, TResponse>(
      (variables: TVariables) =>
        ({
          ...config.generateOptimistic(variables),
          createdAt: new Date().toISOString(),
        }) as Omit<TData, "id" | OptimisticKey>,
    ),
    errorConfig: {
      showToast: true,
      customMessage: config.errorMessage || "Failed to create item",
      retryable: config.retryable ?? false,
      maxRetries: config.maxRetries ?? 0,
    },
  }),

  /**
   * Configuration for update operations
   * Updates existing items in place
   */
  forUpdate: <
    TData extends OptimisticItem,
    TVariables extends Record<string, any>,
    TResponse = any,
  >(config: {
    mutationFn: MutationFunction<TResponse, TVariables>
    queryKey: QueryKey
    getId: (variables: TVariables) => string
    onSuccess?: (result: TResponse, variables: TVariables) => void | Promise<void>
    errorMessage?: string
    retryable?: boolean
    maxRetries?: number
  }): OptimisticMutationConfig<TData, TVariables, TResponse> => ({
    mutationFn: config.mutationFn,
    queryKey: config.queryKey,
    onSuccess: config.onSuccess,
    ...optimisticStrategies.update<TData, TResponse>(config.getId),
    errorConfig: {
      showToast: true,
      customMessage: config.errorMessage || "Failed to update item",
      retryable: config.retryable ?? false,
      maxRetries: config.maxRetries ?? 0,
    },
  }),

  /**
   * Configuration for delete operations
   * Removes items from the list
   */
  forDelete: <TData extends OptimisticItem, TVariables, TResponse = any>(config: {
    mutationFn: MutationFunction<TResponse, TVariables>
    queryKey: QueryKey
    getId: (variables: TVariables) => string
    onSuccess?: (result: TResponse, variables: TVariables) => void | Promise<void>
    errorMessage?: string
    retryable?: boolean
  }): OptimisticMutationConfig<TData, TVariables, TResponse> => ({
    mutationFn: config.mutationFn,
    queryKey: config.queryKey,
    onSuccess: config.onSuccess,
    ...optimisticStrategies.delete<TData, TResponse>(config.getId),
    errorConfig: {
      showToast: true,
      customMessage: config.errorMessage || "Failed to delete item",
      retryable: config.retryable ?? false,
      maxRetries: 0, // Usually don't retry deletes
    },
  }),

  /**
   * Configuration for toggle operations
   * Updates specific properties while preserving others
   */
  forToggle: <TData extends OptimisticItem, TVariables, TResponse = any>(config: {
    mutationFn: MutationFunction<TResponse, TVariables>
    queryKey: QueryKey
    getId: (variables: TVariables) => string
    getToggleData: (variables: TVariables) => Partial<TData>
    onSuccess?: (result: TResponse, variables: TVariables) => void | Promise<void>
    errorMessage?: string
    retryable?: boolean
  }): OptimisticMutationConfig<TData, TVariables, TResponse> => ({
    mutationFn: config.mutationFn,
    queryKey: config.queryKey,
    onSuccess: config.onSuccess,
    ...optimisticStrategies.toggle<TData, TResponse>(config.getId, config.getToggleData),
    errorConfig: {
      showToast: true,
      customMessage: config.errorMessage || "Failed to toggle item",
      retryable: config.retryable ?? true,
      maxRetries: 0,
    },
  }),

  /**
   * Configuration for custom operations
   * Provides full control over optimistic update behavior
   */
  custom: <TData extends OptimisticItem, TVariables, TResponse = any, TContext = unknown>(
    config: OptimisticMutationConfig<TData, TVariables, TResponse, TContext>,
  ): OptimisticMutationConfig<TData, TVariables, TResponse, TContext> => ({
    errorConfig: {
      showToast: true,
      retryable: false,
      maxRetries: 0,
    },
    ...config,
  }),
}

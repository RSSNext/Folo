import type { MutationFunction, QueryKey } from "@tanstack/react-query"

export const optimisticKey = Symbol("optimistic")
export const optimisticStatusKey = Symbol("optimisticStatus")

export type OptimisticKey = typeof optimisticKey
export type OptimisticStatusKey = typeof optimisticStatusKey
// Base interface for items that support optimistic updates
export interface OptimisticItem {
  id: string
  // Use prefixed properties to minimize conflicts
  [optimisticKey]?: boolean
  [optimisticStatusKey]?: "pending" | "updating" | "error" | "connected"
  updatedAt?: string
}

// Generic optimistic wrapper type
export type WithOptimistic<T extends { id: string }> = T & {
  [optimisticKey]?: boolean
  [optimisticStatusKey]?: "pending" | "updating" | "error" | "connected"
}

// Core optimistic update configuration
export interface OptimisticMutationConfig<
  TData extends OptimisticItem,
  TVariables,
  TResponse = any,
  TContext = unknown,
> {
  // Basic configuration - mutationFn can return any response type
  mutationFn: MutationFunction<TResponse, TVariables>
  queryKey: QueryKey

  // Optimistic update strategy
  optimisticUpdater: (
    variables: TVariables,
    previousData: TData[],
  ) => {
    newData: TData[]
    rollbackData: TData[]
    tempId?: string
  }

  // Success data mapping - handles any response type
  successUpdater?: (
    result: TResponse,
    variables: TVariables,
    previousData: TData[],
    context?: TContext,
  ) => TData[]

  // Error handling configuration
  errorConfig?: {
    showToast?: boolean
    customMessage?: string
    retryable?: boolean
    maxRetries?: number
  }

  // Success callback - receives the actual API response
  onSuccess?: (result: TResponse, variables: TVariables) => void | Promise<void>
}

// Optimistic update context returned from onMutate
export interface OptimisticContext {
  rollbackData: any[]
  tempId?: string
  previousData: any[]
  targetId?: string
}

// Strategy configuration for different operation types
export interface StrategyConfig<T extends OptimisticItem, TResponse = any> {
  optimisticUpdater: OptimisticMutationConfig<T, any, TResponse>["optimisticUpdater"]
  successUpdater?: OptimisticMutationConfig<T, any, TResponse>["successUpdater"]
}

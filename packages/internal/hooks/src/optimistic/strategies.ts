import type { OptimisticItem, OptimisticKey, StrategyConfig } from "./types"
import { optimisticKey, optimisticStatusKey } from "./types"

/**
 * Predefined optimistic update strategies for common operations
 */
export const optimisticStrategies = {
  /**
   * Strategy for creating new items
   * Adds the new item to the beginning of the list with a temporary ID
   */
  create: <T extends OptimisticItem, TResponse = T>(
    generateOptimisticItem: (variables: any) => Omit<T, "id" | OptimisticKey>,
  ): StrategyConfig<T, TResponse> => ({
    optimisticUpdater: (variables: any, previousData: T[]) => {
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
      const optimisticItem = {
        ...generateOptimisticItem(variables),
        id: tempId,
        [optimisticKey]: true,
        [optimisticStatusKey]: "pending",
        updatedAt: new Date().toISOString(),
      } as T

      return {
        newData: [optimisticItem, ...previousData],
        rollbackData: previousData,
        tempId,
      }
    },

    successUpdater: (result: TResponse, variables: any, previousData: T[], context: any) => {
      return previousData.map((item) =>
        item.id === context?.tempId
          ? { ...item, ...(result as any), [optimisticKey]: false }
          : item,
      )
    },
  }),

  /**
   * Strategy for updating existing items
   * Updates the item in place and marks it as optimistic
   */
  update: <T extends OptimisticItem, TResponse = T>(
    getTargetId: string | ((variables: any) => string),
  ): StrategyConfig<T, TResponse> => ({
    optimisticUpdater: (variables: any, previousData: T[]) => {
      const targetId = typeof getTargetId === "function" ? getTargetId(variables) : getTargetId

      const newData = previousData.map((item) =>
        item.id === targetId
          ? {
              ...item,
              ...variables,
              [optimisticKey]: true,
              [optimisticStatusKey]: "updating",
              updatedAt: new Date().toISOString(),
            }
          : item,
      )

      return {
        newData,
        rollbackData: previousData,
        targetId,
      }
    },

    successUpdater: (result: TResponse, variables: any, previousData: T[]) => {
      const targetId = typeof getTargetId === "function" ? getTargetId(variables) : getTargetId
      return previousData.map((item) =>
        item.id === targetId ? { ...item, ...(result as any), [optimisticKey]: false } : item,
      )
    },
  }),

  /**
   * Strategy for deleting items
   * Removes the item from the list immediately
   */
  delete: <T extends OptimisticItem, TResponse = any>(
    getId: (variables: any) => string,
  ): StrategyConfig<T, TResponse> => ({
    optimisticUpdater: (variables: any, previousData: T[]) => {
      const targetId = getId(variables)
      const newData = previousData.filter((item) => item.id !== targetId)

      return {
        newData,
        rollbackData: previousData,
        targetId,
      }
    },
  }),

  /**
   * Strategy for toggling item properties
   * Updates specific properties while keeping the rest unchanged
   */
  toggle: <T extends OptimisticItem, TResponse = any>(
    getId: (variables: any) => string,
    getToggleData: (variables: any) => Partial<T>,
  ): StrategyConfig<T, TResponse> => ({
    optimisticUpdater: (variables: any, previousData: T[]) => {
      const targetId = getId(variables)
      const toggleData = getToggleData(variables)

      const newData = previousData.map((item) =>
        item.id === targetId
          ? {
              ...item,
              ...toggleData,
              [optimisticKey]: true,
              [optimisticStatusKey]: "updating",

              updatedAt: new Date().toISOString(),
            }
          : item,
      )

      return {
        newData,
        rollbackData: previousData,
        targetId,
      }
    },

    successUpdater: (result: TResponse, variables: any, previousData: T[]) => {
      const targetId = getId(variables)
      return previousData.map((item) =>
        item.id === targetId ? { ...item, ...(result as any), [optimisticKey]: false } : item,
      )
    },
  }),
}

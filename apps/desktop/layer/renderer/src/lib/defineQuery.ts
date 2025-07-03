import type { InfiniteData, QueryFunction, QueryKey } from "@tanstack/react-query"
import type { Draft, ValidRecipeReturnType } from "immer"
import { produce } from "immer"

import { queryClient } from "./query-client"

export type DefinedQuery<TQueryKey extends QueryKey, TData> = Readonly<{
  key: TQueryKey
  fn: QueryFunction<TData>
  rootKey?: QueryKey

  cancel: (key?: (key: TQueryKey) => QueryKey) => Promise<void>
  remove: (key?: (key: TQueryKey) => QueryKey) => Promise<void>

  invalidate: (options?: {
    keyExtractor?: (key: TQueryKey) => QueryKey
    exact?: boolean
  }) => Promise<void>
  invalidateRoot: () => void

  refetch: () => Promise<TData | undefined>
  prefetch: () => Promise<TData | undefined>

  setData: <Data = TData>(
    updater: (draft: Draft<Data>) => ValidRecipeReturnType<Draft<Data>>,
  ) => void
  setInfiniteData: (
    updater: (
      draft: Draft<InfiniteData<TData>>,
    ) => ValidRecipeReturnType<Draft<InfiniteData<TData>>>,
  ) => void
  getData: () => TData | undefined

  optimisticUpdate: <Data = TData>(
    updater: (draft: Draft<Data>) => ValidRecipeReturnType<Draft<Data>> | void,
  ) => Promise<{
    previousData: Awaited<Data> | undefined
    restore: () => void
    invalidate: () => void
  }>

  optimisticInfiniteUpdate: (
    updater: (
      draft: Draft<InfiniteData<TData>>,
    ) => ValidRecipeReturnType<Draft<InfiniteData<TData>>>,
  ) => Promise<{
    previousData: Awaited<InfiniteData<TData>> | undefined
    restore: () => void
    invalidate: () => void
  }>
}>

export type DefinedQueryOptions<TData> = {
  // shouldPersist?: boolean;
  rootKey?: QueryKey

  onCancel?: () => void | Promise<void>
  onInvalidate?: () => void | Promise<void>
  onInvalidateRoot?: () => void
  onRefetch?: (data?: TData) => void
  onRefetchRoot?: () => void
  onOptimisticUpdate?: () => void
  onOptimisticUpdateRestore?: () => void
}

export function defineQuery<
  TQueryKey extends QueryKey,
  TQueryFn extends QueryFunction<unknown>,
  TData = Awaited<ReturnType<TQueryFn>>,
>(
  key: TQueryKey,
  fn: TQueryFn,
  options?: DefinedQueryOptions<TData>,
): DefinedQuery<TQueryKey, TData>

export function defineQuery<
  TQueryKey extends QueryKey,
  TQueryFn extends QueryFunction<any>,
  TData = Awaited<ReturnType<TQueryFn>>,
>(key: TQueryKey, fn: TQueryFn, options?: DefinedQueryOptions<TData>) {
  const queryDefine: DefinedQuery<TQueryKey, TData> = {
    key,
    fn,
    rootKey: options?.rootKey,

    invalidateRoot: () => {
      if (options?.rootKey) {
        queryClient.invalidateQueries({
          queryKey: options.rootKey,
          refetchType: "all",
        })
        options?.onInvalidateRoot?.()
      }
    },
    prefetch: async () => {
      await queryClient.prefetchQuery({
        queryKey: key,
        queryFn: fn,
      })
      return queryClient.getQueryData<TData>(key)
    },
    cancel: async (keyExtactor) => {
      const queryKey = typeof keyExtactor === "function" ? keyExtactor(key) : key
      await queryClient.cancelQueries({
        queryKey,
      })
      options?.onCancel?.()
    },
    remove: async (keyExtactor) => {
      const queryKey = typeof keyExtactor === "function" ? keyExtactor(key) : key
      queryClient.removeQueries({ queryKey })
    },
    invalidate: async (args) => {
      const { keyExtractor, exact } = args || {}
      const queryKey = typeof keyExtractor === "function" ? keyExtractor(key) : key

      await queryClient.invalidateQueries({
        queryKey,
        refetchType: "all",
        exact,
      })
      options?.onInvalidate?.()
    },

    refetch: async () => {
      await queryClient.refetchQueries({
        queryKey: key,
      })
      options?.onRefetch?.()
      return queryClient.getQueryData<TData>(key)
    },

    setData: (updater) =>
      queryClient.setQueryData<TData>(key, (old) => {
        if (!old) return
        if (typeof updater !== "function") return old

        return produce(old, updater)
      }),

    setInfiniteData: (updater) => queryDefine.setData<InfiniteData<TData>>(updater),
    getData: () => queryClient.getQueryData<TData>(key),

    optimisticUpdate: async <Data = TData>(
      updater: (draft: Draft<Data>) => ValidRecipeReturnType<Draft<Data>>,
    ) => {
      await queryClient.cancelQueries({
        queryKey: key,
      })
      const previousData = await queryClient.getQueryData<Data>(key)
      await queryClient.setQueryData<Data>(key, (old) => {
        if (!old) return
        if (typeof updater !== "function") return old

        return produce(old, updater)
      })
      options?.onOptimisticUpdate?.()

      return {
        previousData,
        restore: () => {
          queryClient.setQueryData<Data>(key, previousData)
          options?.onOptimisticUpdateRestore?.()
        },
        invalidate: () => {
          queryClient.invalidateQueries({ queryKey: key, refetchType: "all" })
          options?.onInvalidate?.()
        },
      }
    },

    optimisticInfiniteUpdate(updater) {
      return queryDefine.optimisticUpdate<InfiniteData<TData>>(updater)
    },
  }

  return Object.freeze(queryDefine)
}

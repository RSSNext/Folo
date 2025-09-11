import type { QueryKey, UseQueryOptions, UseQueryResult } from "@tanstack/react-query"
import { useQuery } from "@tanstack/react-query"
import type { FetchError } from "ofetch"

import { useLoginModalShow } from "~/atoms/user"
import type { DefinedQuery } from "~/lib/defineQuery"

// TODO split normal define query and infinite define query for better type checking
export type SafeReturnType<T> = T extends (...args: any[]) => infer R ? R : never

export type CombinedObject<T, U> = T & U
export function useAuthQuery<
  TQuery extends DefinedQuery<QueryKey, any>,
  TError = FetchError,
  TQueryFnData = Awaited<ReturnType<TQuery["fn"]>>,
  TData = TQueryFnData,
>(
  query: TQuery,
  options: Omit<UseQueryOptions<TQueryFnData, TError>, "queryKey" | "queryFn"> = {},
): CombinedObject<UseQueryResult<TData, TError>, { key: TQuery["key"]; fn: TQuery["fn"] }> {
  const authFail = useLoginModalShow()
  // @ts-expect-error
  return Object.assign(
    {},
    useQuery({
      queryKey: query.key,
      queryFn: query.fn,
      enabled: !authFail && options.enabled !== false,
      ...options,
    }),
    {
      key: query.key,
      fn: query.fn,
    },
  )
}

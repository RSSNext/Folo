import type {
  AIMemoryCreateRequest,
  AIMemoryListQuery,
  AIMemoryRecord,
  AIMemoryUpdateRequest,
} from "@follow-app/client-sdk"
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query"

import { followApi } from "~/lib/api-client"

const aiMemoryQueryKey = ["ai-memory"] as const

export const aiMemoryKeys = {
  all: aiMemoryQueryKey,
  list: (params: AIMemoryListQuery) => [...aiMemoryQueryKey, "list", params] as const,
  detail: (memoryId: string) => [...aiMemoryQueryKey, "detail", memoryId] as const,
}

export type MemoryListPage = {
  data: AIMemoryRecord[]
  nextBefore?: string
}

const serializeNextBefore = (value: string | Date | undefined) => {
  if (!value) return
  if (typeof value === "string") return value
  if (value instanceof Date) return value.toISOString()
  return new Date(value).toISOString()
}

export type MemoryListQuery = Omit<AIMemoryListQuery, "before"> & { limit?: number }

export const useAIMemoryListQuery = (params: MemoryListQuery = {}) => {
  const limit = params.limit ?? 20

  return useInfiniteQuery({
    queryKey: aiMemoryKeys.list({ ...params, limit }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: MemoryListPage) =>
      lastPage.nextBefore ? serializeNextBefore(lastPage.nextBefore) : undefined,
    queryFn: async ({ pageParam }) => {
      const response = await followApi.ai.memory.list({
        ...params,
        limit,
        // @ts-expect-error TODO: fix type
        before: pageParam ?? undefined,
      })

      return {
        data: response.data,
        nextBefore: serializeNextBefore(response.nextBefore),
      } satisfies MemoryListPage
    },
    staleTime: 30_000,
  })
}

export const useCreateAIMemoryMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: AIMemoryCreateRequest) => followApi.ai.memory.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aiMemoryQueryKey })
    },
  })
}

export const useUpdateAIMemoryMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: AIMemoryUpdateRequest) => followApi.ai.memory.update(input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: aiMemoryQueryKey })
      if (variables.memoryId) {
        queryClient.invalidateQueries({ queryKey: aiMemoryKeys.detail(variables.memoryId) })
      }
    },
  })
}

export const useDeleteAIMemoryMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ memoryId }: { memoryId: string }) => followApi.ai.memory.delete({ memoryId }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: aiMemoryQueryKey })
      queryClient.invalidateQueries({ queryKey: aiMemoryKeys.detail(variables.memoryId) })
    },
  })
}

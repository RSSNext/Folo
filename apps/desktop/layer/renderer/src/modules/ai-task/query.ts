import type {
  CreateTaskRequest,
  TaskCreateResponse,
  TaskDeleteResponse,
  TaskUpdateResponse,
  UpdateTaskRequest,
} from "@follow-app/client-sdk"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { followApi } from "~/lib/api-client"

export const aiTaskKeys = {
  all: ["ai-task"] as const,
  lists: () => [...aiTaskKeys.all, "list"] as const,
  list: () => [...aiTaskKeys.lists()] as const,
  details: () => [...aiTaskKeys.all, "detail"] as const,
  detail: (id: string) => [...aiTaskKeys.details(), id] as const,
}

// Queries

export const useAITaskListQuery = () => {
  const { data } = useQuery({
    queryKey: aiTaskKeys.list(),
    queryFn: () => followApi.aiTask.list(),
  })
  return data?.data
}

export const useAITaskQuery = (id: string | undefined, opts?: { enabled?: boolean }) => {
  const enabled = !!id && (opts?.enabled ?? true)
  const { data } = useQuery({
    queryKey: id ? aiTaskKeys.detail(id) : aiTaskKeys.details(),
    queryFn: () => followApi.aiTask.get({ id: id as string }),
    enabled,
  })
  return data?.data
}

// Mutations

export const useCreateAITaskMutation = () => {
  const qc = useQueryClient()
  return useMutation<TaskCreateResponse, unknown, CreateTaskRequest>({
    mutationFn: (input) => followApi.aiTask.create(input),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: aiTaskKeys.lists() })
    },
  })
}

export const useUpdateAITaskMutation = () => {
  const qc = useQueryClient()
  return useMutation<TaskUpdateResponse, unknown, UpdateTaskRequest>({
    mutationFn: (input) => followApi.aiTask.update(input),
    onSuccess: async (res) => {
      const id = res?.data?.id ?? undefined
      await Promise.all([
        qc.invalidateQueries({ queryKey: aiTaskKeys.lists() }),
        id ? qc.invalidateQueries({ queryKey: aiTaskKeys.detail(id) }) : Promise.resolve(),
      ])
    },
  })
}

export const useDeleteAITaskMutation = () => {
  const qc = useQueryClient()
  return useMutation<TaskDeleteResponse, unknown, { id: string }>({
    mutationFn: ({ id }) => followApi.aiTask.delete({ id }),
    onSuccess: async (_res, vars) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: aiTaskKeys.lists() }),
        qc.invalidateQueries({ queryKey: aiTaskKeys.detail(vars.id) }),
      ])
    },
  })
}

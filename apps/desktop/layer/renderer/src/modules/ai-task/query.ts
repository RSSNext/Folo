import type { WithOptimistic } from "@follow/hooks"
import { createOptimisticConfig, useOptimisticMutation } from "@follow/hooks"
import type {
  AITask,
  CreateTaskRequest,
  TaskCreateResponse,
  UpdateTaskRequest,
} from "@follow-app/client-sdk"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { followApi } from "~/lib/api-client"

const MAX_AI_TASKS = 10

// Use the generic optimistic wrapper type
type OptimisticAITask = WithOptimistic<AITask>

const aiTaskKey = "ai-task"
export const aiTaskKeys = {
  list: [aiTaskKey, "list"] as const,
  details: [aiTaskKey, "detail"] as const,
  detail: (id: string) => [...aiTaskKeys.details, id] as const,
  testRun: [aiTaskKey, "test-run"] as const,
}

// Queries

export const useAITaskListQuery = () => {
  const { data } = useQuery({
    queryKey: aiTaskKeys.list,
    queryFn: () => followApi.aiTask.list().then((res) => res.data),
  })
  return data
}

export const useCanCreateNewAITask = () => {
  const tasks = useAITaskListQuery()
  return !tasks || tasks.length < MAX_AI_TASKS
}

export const useAITaskQuery = (id: string | undefined, opts?: { enabled?: boolean }) => {
  const enabled = !!id && (opts?.enabled ?? true)
  const { data } = useQuery({
    queryKey: id ? aiTaskKeys.detail(id) : aiTaskKeys.details,
    queryFn: () => followApi.aiTask.get({ id: id as string }),
    enabled,
  })
  return data?.data
}

// Mutations

export const useCreateAITaskMutation = () => {
  return useOptimisticMutation(
    createOptimisticConfig.forCreate<OptimisticAITask, CreateTaskRequest, TaskCreateResponse>({
      mutationFn: (input) => followApi.aiTask.create(input),
      queryKey: aiTaskKeys.list,
      generateOptimistic: (variables) => ({
        name: variables.name,
        prompt: variables.prompt,
        isEnabled: variables.isEnabled ?? true,
        schedule: variables.schedule,
        options: variables.options ?? { notifyChannels: ["email"] },
        userId: "temp-user",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastRunAt: null,
        nextRunAt: null,
        runCount: 0,
        lastResult: null,
        lastError: null,
      }),

      errorMessage: "Failed to create AI task",
      retryable: false,
    }),
  )
}

export const useUpdateAITaskMutation = () => {
  return useOptimisticMutation(
    createOptimisticConfig.forUpdate<OptimisticAITask, UpdateTaskRequest>({
      mutationFn: (input) => followApi.aiTask.update(input),
      queryKey: aiTaskKeys.list,
      getId: (variables) => variables.id,
      errorMessage: "Failed to update AI task",
      retryable: false,
    }),
  )
}

export const useDeleteAITaskMutation = () => {
  return useOptimisticMutation(
    createOptimisticConfig.forDelete<OptimisticAITask, { id: string }>({
      mutationFn: ({ id }) => followApi.aiTask.delete({ id }),
      queryKey: aiTaskKeys.list,
      getId: (variables) => variables.id,

      errorMessage: "Failed to delete AI task",
      retryable: false,
    }),
  )
}

export const useTestRunAITaskMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: aiTaskKeys.testRun,
    mutationFn: ({ id }: { id: string }) => followApi.aiTask.testRun({ id }, { timeout: 80000 }),
    onSuccess: async (_res, { id }) => {
      // Refresh task list and detail to reflect any updated run info
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: aiTaskKeys.list }),
        queryClient.invalidateQueries({ queryKey: aiTaskKeys.detail(id) }),
      ])
    },
  })
}

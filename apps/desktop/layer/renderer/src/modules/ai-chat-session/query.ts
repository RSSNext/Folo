import type {
  DeleteSessionRequest,
  GetMessagesQuery,
  GetUnreadQuery,
  ListSessionsQuery,
  MarkSeenRequest,
  SessionResponse,
  UpdateSessionRequest,
} from "@follow-app/client-sdk"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { followApi } from "~/lib/api-client"

export const aiChatSessionKeys = {
  all: ["ai-chat-session"] as const,
  lists: () => [...aiChatSessionKeys.all, "list"] as const,
  list: (filters?: ListSessionsQuery) => [...aiChatSessionKeys.lists(), filters] as const,
  details: () => [...aiChatSessionKeys.all, "detail"] as const,
  detail: (chatId: string) => [...aiChatSessionKeys.details(), chatId] as const,
  messages: () => [...aiChatSessionKeys.all, "messages"] as const,
  message: (chatId: string, filters?: GetMessagesQuery) =>
    [...aiChatSessionKeys.messages(), chatId, filters] as const,
  unread: () => [...aiChatSessionKeys.all, "unread"] as const,
}

// Queries

export const useAIChatSessionListQuery = (filters?: ListSessionsQuery) => {
  const { data } = useQuery({
    queryKey: aiChatSessionKeys.list(filters),
    queryFn: () => followApi.aiChatSessions.list(filters),
  })
  return data?.data
}

export const useAIChatSessionQuery = (chatId: string | undefined, opts?: { enabled?: boolean }) => {
  const enabled = !!chatId && (opts?.enabled ?? true)
  const { data } = useQuery({
    queryKey: chatId ? aiChatSessionKeys.detail(chatId) : aiChatSessionKeys.details(),
    queryFn: () => followApi.aiChatSessions.get({ chatId: chatId as string }),
    enabled,
  })
  return data?.data
}

export const useAIChatMessagesQuery = (
  chatId: string | undefined,
  filters?: GetMessagesQuery,
  opts?: { enabled?: boolean },
) => {
  const enabled = !!chatId && (opts?.enabled ?? true)
  const { data } = useQuery({
    queryKey: chatId ? aiChatSessionKeys.message(chatId, filters) : aiChatSessionKeys.messages(),
    queryFn: () => followApi.aiChatSessions.messages.get({ chatId: chatId as string, ...filters }),
    enabled,
  })
  return data?.data
}

export const useUnreadChatSessionsQuery = (filters?: GetUnreadQuery) => {
  const { data } = useQuery({
    queryKey: aiChatSessionKeys.unread(),
    queryFn: () => followApi.aiChatSessions.unread(filters),
  })
  return data?.data
}

// Mutations

export const useUpdateAIChatSessionMutation = () => {
  const qc = useQueryClient()
  return useMutation<SessionResponse, unknown, UpdateSessionRequest>({
    mutationFn: (input) => followApi.aiChatSessions.update(input),
    onSuccess: async (res) => {
      const chatId = res?.data?.chatId ?? undefined
      await Promise.all([
        qc.invalidateQueries({ queryKey: aiChatSessionKeys.lists() }),
        chatId
          ? qc.invalidateQueries({ queryKey: aiChatSessionKeys.detail(chatId) })
          : Promise.resolve(),
      ])
    },
  })
}

export const useDeleteAIChatSessionMutation = () => {
  const qc = useQueryClient()
  return useMutation<{ success: boolean }, unknown, DeleteSessionRequest>({
    mutationFn: (input) => followApi.aiChatSessions.delete(input),
    onSuccess: async (_res, vars) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: aiChatSessionKeys.lists() }),
        qc.invalidateQueries({ queryKey: aiChatSessionKeys.detail(vars.chatId) }),
        qc.invalidateQueries({ queryKey: aiChatSessionKeys.messages() }),
      ])
    },
  })
}

export const useMarkChatSessionSeenMutation = () => {
  const qc = useQueryClient()
  return useMutation<SessionResponse, unknown, MarkSeenRequest>({
    mutationFn: (input) => followApi.aiChatSessions.markSeen(input),
    onSuccess: async (res) => {
      const chatId = res?.data?.chatId ?? undefined
      await Promise.all([
        qc.invalidateQueries({ queryKey: aiChatSessionKeys.lists() }),
        qc.invalidateQueries({ queryKey: aiChatSessionKeys.unread() }),
        chatId
          ? qc.invalidateQueries({ queryKey: aiChatSessionKeys.detail(chatId) })
          : Promise.resolve(),
      ])
    },
  })
}

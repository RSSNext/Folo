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

const aiChatSessionKey = "ai-chat-session"
export const aiChatSessionKeys = {
  lists: [aiChatSessionKey, "list"] as const,
  list: (filters?: ListSessionsQuery) => [aiChatSessionKey, "list", filters] as const,
  details: [aiChatSessionKey, "detail"] as const,
  detail: (chatId: string) => [aiChatSessionKey, "detail", chatId] as const,
  messages: [aiChatSessionKey, "messages"] as const,
  message: (chatId: string, filters?: GetMessagesQuery) =>
    [aiChatSessionKey, "messages", chatId, filters] as const,
  unread: [aiChatSessionKey, "unread"] as const,
} as const

// Queries

export const useAIChatSessionListQuery = (filters?: ListSessionsQuery) => {
  const { data } = useQuery({
    queryKey: aiChatSessionKeys.list(filters),
    queryFn: () => followApi.aiChatSessions.list(filters).then((res) => res.data),
    refetchInterval: 1 * 60 * 1000, // 1 minute
  })
  return data
}

export const useAIChatSessionQuery = (chatId: string | undefined, opts?: { enabled?: boolean }) => {
  const enabled = !!chatId && (opts?.enabled ?? true)
  const { data } = useQuery({
    queryKey: chatId ? aiChatSessionKeys.detail(chatId) : aiChatSessionKeys.details,
    queryFn: () =>
      followApi.aiChatSessions.get({ chatId: chatId as string }).then((res) => res.data),
    enabled,
  })
  return data
}

export const useAIChatMessagesQuery = (
  chatId: string | undefined,
  filters?: GetMessagesQuery,
  opts?: { enabled?: boolean },
) => {
  const enabled = !!chatId && (opts?.enabled ?? true)
  const { data } = useQuery({
    queryKey: chatId ? aiChatSessionKeys.message(chatId, filters) : aiChatSessionKeys.messages,
    queryFn: () =>
      followApi.aiChatSessions.messages
        .get({ chatId: chatId as string, ...filters })
        .then((res) => res.data),
    enabled,
  })
  return data
}

export const useUnreadChatSessionsQuery = (filters?: GetUnreadQuery) => {
  const { data } = useQuery({
    queryKey: aiChatSessionKeys.unread,
    queryFn: () => followApi.aiChatSessions.unread(filters).then((res) => res.data),
  })
  return data
}

// Mutations

export const useUpdateAIChatSessionMutation = () => {
  const qc = useQueryClient()
  return useMutation<SessionResponse, unknown, UpdateSessionRequest>({
    mutationFn: (input) => followApi.aiChatSessions.update(input),
    onSuccess: async (res) => {
      const chatId = res?.data?.chatId ?? undefined
      await Promise.all([
        qc.invalidateQueries({ queryKey: aiChatSessionKeys.lists }),
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
        qc.invalidateQueries({ queryKey: aiChatSessionKeys.lists }),
        qc.invalidateQueries({ queryKey: aiChatSessionKeys.detail(vars.chatId) }),
        qc.invalidateQueries({ queryKey: aiChatSessionKeys.messages }),
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
        qc.invalidateQueries({ queryKey: aiChatSessionKeys.lists }),
        qc.invalidateQueries({ queryKey: aiChatSessionKeys.unread }),
        chatId
          ? qc.invalidateQueries({ queryKey: aiChatSessionKeys.detail(chatId) })
          : Promise.resolve(),
      ])
    },
  })
}

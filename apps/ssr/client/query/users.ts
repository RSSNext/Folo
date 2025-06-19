import { apiClient } from "@client/lib/api-fetch"
import { getProviders } from "@client/lib/auth"
import { getHydrateData } from "@client/lib/helper"
import type { LoginHydrateData } from "@client/pages/(login)/login/metadata"
import type { ExtractBizResponse } from "@follow/models"
import { isBizId, sortByAlphabet } from "@follow/utils/utils"
import { useQuery } from "@tanstack/react-query"

const UN_CATEGORIZED = "Uncategorized"
const groupSubscriptions = (
  subscriptions: SubscriptionResult,
): Record<string, SubscriptionResult> => {
  const groupFolder = {} as Record<string, SubscriptionResult>
  for (const subscription of subscriptions.filter((s) => !s.isPrivate) || []) {
    if (!subscription.category && "feeds" in subscription) {
      subscription.category = UN_CATEGORIZED
    }
    if (subscription.category) {
      if (!groupFolder[subscription.category]) {
        groupFolder[subscription.category] = []
      }
      groupFolder[subscription.category]!.push(subscription)
    }
  }

  // Move the un-categorized to the last
  if (Object.keys(groupFolder)[0] === UN_CATEGORIZED) {
    const temp = groupFolder[UN_CATEGORIZED]
    delete groupFolder[UN_CATEGORIZED]

    Reflect.defineProperty(groupFolder, UN_CATEGORIZED, {
      value: temp?.sort((a, b) => sortByAlphabet(a.title!, b.title!)) || [],
      writable: true,
      configurable: true,
      enumerable: true,
    })
  }
  return groupFolder
}

export type SubscriptionResult = ExtractBizResponse<typeof apiClient.subscriptions.$get>["data"]
const fetchUserSubscriptions = async (userId: string | undefined) => {
  const res = await apiClient.subscriptions.$get({
    query: { userId },
  })
  return res.data
}

export const useUserSubscriptionsQuery = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["subscriptions", "group", userId],
    queryFn: async () => {
      return fetchUserSubscriptions(userId)
    },
    select: groupSubscriptions,
    enabled: !!userId,
    initialData: getHydrateData(`subscriptions.$get,query:userId=${userId}`) as any as Awaited<
      ReturnType<typeof fetchUserSubscriptions>
    >,
  })
}

export const fetchUser = async (handleOrId: string | undefined) => {
  const handle = isBizId(handleOrId || "")
    ? handleOrId
    : `${handleOrId}`.startsWith("@")
      ? `${handleOrId}`.slice(1)
      : handleOrId

  const res = await apiClient.profiles.$get({
    query: {
      handle,
      id: isBizId(handle || "") ? handle : undefined,
    },
  })
  return res.data
}

export type User = Awaited<ReturnType<typeof fetchUser>>
export const useUserQuery = (handleOrId: string | undefined) => {
  return useQuery({
    queryKey: ["profiles", handleOrId],
    queryFn: () => fetchUser(handleOrId),
    enabled: !!handleOrId,
    initialData: getHydrateData(`profiles.$get,query:id=${handleOrId}`) as any as User,
  })
}
export interface AuthProvider {
  name: string
  id: string
  color: string
  icon: string
  icon64: string
  iconDark64?: string
}
const getTypedProviders = async () => {
  const providers = await getProviders()
  return providers.data as Record<string, AuthProvider>
}
export const useAuthProviders = () => {
  return useQuery({
    queryKey: ["providers"],
    queryFn: async () => getTypedProviders(),
    initialData: getHydrateData(`betterAuth`) as LoginHydrateData,
  })
}

export { getTypedProviders as getAuthProviders }

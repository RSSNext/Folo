import { isBizId } from "@follow/utils/utils"

import { callNotFound } from "~/lib/not-found"
import type { MetaTag } from "~/meta-handler"
import { defineMetadata } from "~/meta-handler"

export default defineMetadata(async ({ params, apiClient, origin }): Promise<MetaTag[]> => {
  const mayBeUserId = params.id

  const handle = isBizId(mayBeUserId || "")
    ? mayBeUserId
    : `${mayBeUserId}`.startsWith("@")
      ? `${mayBeUserId}`.slice(1)
      : mayBeUserId

  const profileRes = await apiClient.profiles
    .$get({
      query: {
        handle,
        id: isBizId(handle || "") ? handle : undefined,
      },
    })
    .catch((e) => callNotFound(e.message))

  const realUserId = profileRes.data.id
  const [subscriptionsRes, listsRes] = await Promise.allSettled([
    profileRes.data.id
      ? apiClient.subscriptions.$get({
          query: { userId: realUserId },
        })
      : Promise.reject(),
    profileRes.data.id
      ? apiClient.lists.list.$get({
          query: { userId: realUserId },
        })
      : Promise.reject(),
  ])

  const isSubscriptionsResolved = subscriptionsRes.status === "fulfilled"
  const isListsResolved = listsRes.status === "fulfilled"
  const { name } = profileRes.data
  const subscriptions = isSubscriptionsResolved ? subscriptionsRes.value.data : []

  return [
    {
      type: "title",
      title: name || "",
    },
    {
      type: "description",
      description:
        subscriptions.length > 0
          ? `${name} followed ${subscriptions.length} public subscription${
              subscriptions.length > 1 ? "s" : ""
            }. Follow them to get their latest updates on ${APP_NAME}`
          : "",
    },
    {
      type: "openGraph",
      title: `${name} on ${APP_NAME}`,
      image: `${origin}/og/user/${mayBeUserId}`,
    },
    {
      type: "hydrate",
      data: profileRes.data,
      path: apiClient.profiles.$url({ query: { id: mayBeUserId } }).pathname,
      key: `profiles.$get,query:id=${mayBeUserId}`,
    },
    isSubscriptionsResolved && {
      type: "hydrate",
      data: subscriptionsRes.value.data,
      path: apiClient.subscriptions.$url({ query: { userId: realUserId } }).pathname,
      key: `subscriptions.$get,query:userId=${realUserId}`,
    },
    isListsResolved && {
      type: "hydrate",
      data: listsRes.value.data,
      path: apiClient.lists.list.$url({ query: { userId: realUserId } }).pathname,
      key: `lists.list.$get,query:userId=${realUserId}`,
    },
  ].filter((v) => !!v) as MetaTag[]
})

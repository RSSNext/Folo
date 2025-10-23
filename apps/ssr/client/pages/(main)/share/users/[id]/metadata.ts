import { isBizId } from "@follow/utils/utils"

import { callNotFound } from "../../../../../../src/lib/not-found"
import type { MetaTag } from "../../../../../../src/meta-handler"
import { defineMetadata } from "../../../../../../src/meta-handler"

export default defineMetadata(async ({ params, apiClient, origin }): Promise<MetaTag[]> => {
  const userIdOrHandle = params.id

  let handle = undefined
  let userId = undefined

  if (!userIdOrHandle) {
    throw new Error("User ID or handle is required")
  }

  if (isBizId(userIdOrHandle || "")) {
    userId = userIdOrHandle
  } else {
    handle = userIdOrHandle.startsWith("@") ? userIdOrHandle.slice(1) : userIdOrHandle
  }

  const profileRes = await apiClient.api.profiles
    .getProfile({ id: userId, handle })
    .catch(callNotFound)

  const realUserId = profileRes.data.id
  const [subscriptionsRes, listsRes] = await Promise.allSettled([
    profileRes.data.id ? apiClient.api.subscriptions.get({ userId: realUserId }) : Promise.reject(),
    profileRes.data.id ? apiClient.api.lists.list({ userId: realUserId }) : Promise.reject(),
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
      image: `${origin}/og/user/${userIdOrHandle}`,
    },
    {
      type: "hydrate",
      data: profileRes.data,

      key: `profiles.$get,query:id=${userIdOrHandle}`,
    },
    isSubscriptionsResolved && {
      type: "hydrate",
      data: subscriptionsRes.value.data,

      key: `subscriptions.$get,query:userId=${realUserId}`,
    },
    isListsResolved && {
      type: "hydrate",
      data: listsRes.value.data,

      key: `lists.list.$get,query:userId=${realUserId}`,
    },
  ].filter((v) => !!v) as MetaTag[]
})

import { isBizId } from "@follow/utils/utils"

import { defineMetadata } from "~/meta-handler"

export default defineMetadata(async ({ params, apiClient, origin, throwError }) => {
  const userId = params.id

  const handle = isBizId(userId || "")
    ? userId
    : `${userId}`.startsWith("@")
      ? `${userId}`.slice(1)
      : userId

  const res = await apiClient.profiles
    .$get({
      query: {
        handle,
        id: isBizId(handle || "") ? handle : undefined,
      },
    })
    .catch((e) => throwError(e.response?.status || 500, "User not found"))
  const { name } = res.data
  return [
    {
      type: "title",
      title: name || "",
    },
    {
      type: "openGraph",
      title: name || "",
      image: `${origin}/og/user/${userId}`,
    },
    {
      type: "hydrate",
      data: res.data,
      path: apiClient.profiles.$url({ query: { id: userId } }).pathname,
      key: `profiles.$get,query:id=${userId}`,
    },
  ]
})

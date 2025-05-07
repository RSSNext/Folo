import { APPLE_APP_STORE_ID } from "@follow/constants"

import { defineMetadata } from "~/meta-handler"

export default defineMetadata(async ({ params, apiClient, origin, throwError }) => {
  const listId = params.id!
  const list = await apiClient.lists
    .$get({ query: { listId } })
    .catch((e) => throwError(e.response?.status || 500, "List not found"))

  const { title, description } = list.data.list
  return [
    {
      type: "openGraph",
      title: title || "",
      description: description || "",
      image: `${origin}/og/list/${listId}`,
    },
    {
      type: "title",
      title: title || "",
    },
    {
      type: "hydrate",
      data: list.data,
      path: apiClient.lists.$url({ query: { listId } }).pathname,
      key: `lists.$get,query:listId=${listId}`,
    },
    {
      type: "meta",
      property: "apple-itunes-app",
      content: `app-id=${APPLE_APP_STORE_ID}, app-argument=follow://add?id=${listId}&type=list`,
    },
  ]
})

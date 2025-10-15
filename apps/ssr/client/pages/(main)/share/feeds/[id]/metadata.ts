import type { GetHydrateData } from "@client/lib/helper"
import { APPLE_APP_STORE_ID } from "@follow/constants"

import { callNotFound } from "../../../../../../src/lib/not-found"
import { defineMetadata } from "../../../../../../src/meta-handler"

const meta = defineMetadata(async ({ params, apiClient, origin }) => {
  const feedId = params.id

  const feed = await apiClient.api.feeds.get({ id: feedId }).catch(callNotFound)

  const { title, description } = feed.data.feed

  return [
    {
      type: "openGraph",
      title: title || "",
      description: description || "",
      image: `${origin}/og/feed/${feedId}`,
    },
    {
      type: "title",
      title: title || "",
    },
    {
      type: "hydrate",
      data: feed.data,
      path: `/feeds/${feedId}`,
      key: `feeds.$get,query:id=${feedId}`,
    },
    {
      type: "meta",
      property: "apple-itunes-app",
      content: `app-id=${APPLE_APP_STORE_ID}, app-argument=follow://add?id=${feedId}&type=feed`,
    },
  ] as const
})

export type FeedHydrateData = GetHydrateData<typeof meta>
export default meta

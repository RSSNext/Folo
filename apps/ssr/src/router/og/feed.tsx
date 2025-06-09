import { getFeedIconSrc } from "@follow/components/utils/icon.js"
import { formatNumber } from "@follow/utils"
import * as React from "react"

import type { ApiClient } from "~/lib/api-client"
import { renderToImage } from "~/lib/og/render-to-image"

import { getImageBase64, OGAvatar, OGCanvas } from "./__base"

export const renderFeedOG = async (apiClient: ApiClient, feedId: string) => {
  const feed = await apiClient.feeds.$get({ query: { id: feedId } }).catch(() => null)

  if (!feed?.data.feed) {
    throw 404
  }

  const { title, description, image } = feed.data.feed

  const [src] = getFeedIconSrc({
    siteUrl: feed.data.feed.siteUrl!,
    proxy: {
      width: 256,
      height: 256,
    },
    fallback: true,
    src: image!,
  })

  const imageBase64 = await getImageBase64(image || src)

  try {
    const imageRes = await renderToImage(
      <OGCanvas seed={title!}>
        <div
          style={{
            display: "flex",
            flexGrow: 1,
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            width: "40%",
          }}
        >
          <OGAvatar base64={imageBase64} title={title!} />
        </div>
        <div
          style={{
            display: "flex",
            flexGrow: 1,
            flexShrink: 1,
            width: "60%",
            flexDirection: "column",
            overflow: "hidden",
            textAlign: "left",
            justifyContent: "center",
          }}
        >
          <h3
            style={{
              color: "#000000",
              fontSize: "3.5rem",
              whiteSpace: "nowrap",
            }}
          >
            {title}
          </h3>
          {description && (
            <p
              style={{
                fontSize: "1.8rem",
                height: "5.6rem",
                overflow: "hidden",
                lineClamp: 2,
                color: "#000000",
              }}
            >
              {description}
            </p>
          )}

          <p
            style={{
              fontSize: "1.5rem",
              color: "#000000",
              fontWeight: 500,
            }}
          >
            {formatNumber(feed.data.subscriptionCount || 0)} followers with{" "}
            {formatNumber(feed.data.readCount || 0)} recent reads on Folo
          </p>
        </div>
      </OGCanvas>,
      {
        width: 1200,
        height: 600,
      },
    )

    return imageRes
  } catch (err) {
    console.error(err)
    return null
  }
}

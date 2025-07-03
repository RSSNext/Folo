import { getFeedIconSrc } from "@follow/components/utils/icon.js"
import * as React from "react"

import type { ApiClient } from "~/lib/api-client"
import { renderToImage } from "~/lib/og/render-to-image"

import { getImageBase64, OGAvatar, OGCanvas } from "./__base"

export const renderListOG = async (apiClient: ApiClient, listId: string) => {
  const feed = await apiClient.lists.$get({ query: { listId } }).catch(() => null)

  if (!feed?.data.list) {
    throw 404
  }

  const { title, description, image } = feed.data.list

  const [src] = getFeedIconSrc({
    proxy: {
      width: 256,
      height: 256,
    },
    fallback: true,
    src: image!,
  })

  const numberFormatter = new Intl.NumberFormat("en-US")
  let imageBase64: string | null = null

  if (src) {
    imageBase64 = await getImageBase64(src)
  }

  try {
    const imageRes = await renderToImage(
      <OGCanvas seed={title!}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            gap: 15,
            padding: "0 60px",
          }}
        >
          <OGAvatar base64={imageBase64} title={title!} />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
              overflow: "hidden",
            }}
          >
            <h3
              style={{
                color: "#e6edf3",
                fontSize: "3.2rem",
                fontWeight: 600,
                margin: 0,
              }}
            >
              {title}
            </h3>
            {description && (
              <p
                style={{
                  fontSize: "1.8rem",
                  color: "#8b949e",
                  margin: 0,
                  maxHeight: "5.4rem",
                  lineHeight: 1.5,
                  overflow: "hidden",
                }}
              >
                {description}
              </p>
            )}
          </div>
          <p
            style={{
              fontSize: "1.5rem",
              color: "#afb8c1",
              fontWeight: 500,
              margin: 0,
              paddingTop: 10,
            }}
          >
            {numberFormatter.format(feed.data.subscriptionCount)} followers with{" "}
            {numberFormatter.format(feed.data.readCount)} recent reads on Folo
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

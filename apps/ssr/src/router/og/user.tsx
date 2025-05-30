import { isBizId } from "@follow/utils/utils"
import * as React from "react"

import type { ApiClient } from "~/lib/api-client"
import { renderToImage } from "~/lib/og/render-to-image"

import { getImageBase64, OGAvatar, OGCanvas } from "./__base"

export const renderUserOG = async (apiClient: ApiClient, id: string) => {
  const handle = isBizId(id || "") ? id : `${id}`.startsWith("@") ? `${id}`.slice(1) : id

  const user = await apiClient.profiles.$get({
    query: {
      handle,
      id: isBizId(handle || "") ? handle : undefined,
    },
  })

  if (!user) {
    throw 404
  }

  const imageBase64 = await getImageBase64(user.data.image)

  return await renderToImage(
    <OGCanvas seed={user.data.id}>
      <div
        style={{
          display: "flex",
          flexGrow: 1,
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          width: "45%",

          overflow: "hidden",
        }}
      >
        <OGAvatar base64={imageBase64} title={user.data.name!} />
      </div>

      <div
        style={{
          display: "flex",
          flexGrow: 1,
          flexShrink: 1,
          width: "52%",
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
          {user.data.name}
        </h3>
        {user.data.handle && (
          <p
            style={{
              fontSize: "1.8rem",
              height: "5.8rem",
              overflow: "hidden",
              lineClamp: 2,
              color: "#000022",
            }}
          >
            @{user.data.handle}
          </p>
        )}
      </div>
    </OGCanvas>,
    {
      width: 1200,
      height: 600,
    },
  )
}

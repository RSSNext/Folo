import type { FollowClient } from "@follow-app/client-sdk"
import { FollowAPIError } from "@follow-app/client-sdk"
import * as React from "react"

import { renderToImage } from "../../lib/og/render-to-image"
import { getUserProfile } from "../../lib/user-profile-params"
import { getImageBase64, OGAvatar, OGCanvas } from "./__base"

export const renderUserOG = async (apiClient: FollowClient, handleOrId: string) => {
  const user = await getUserProfile(apiClient, handleOrId).catch((error: unknown) => {
    if (error instanceof FollowAPIError && error.status === 404) throw 404
    throw error
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
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          gap: 25,
        }}
      >
        <OGAvatar base64={imageBase64} title={user.data.name!} />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <h3
            style={{
              color: "#ffffff",
              fontSize: "4.5rem",
              fontWeight: 700,
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            {user.data.name}
          </h3>
          {user.data.handle && (
            <p
              style={{
                fontSize: "2.5rem",
                color: "#8b949e",
                margin: 0,
                marginTop: 12,
              }}
            >
              @{user.data.handle}
            </p>
          )}
        </div>
      </div>
    </OGCanvas>,
    {
      width: 1200,
      height: 600,
    },
  )
}

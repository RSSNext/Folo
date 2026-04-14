import { Hono } from "hono"

import type { Env } from "../env"
import { IMMUTABLE_ASSET_CACHE_CONTROL } from "../lib/r2"

export const assetsRoute = new Hono<{ Bindings: Env }>()

assetsRoute.get("/assets/*", async (c) => {
  const key = c.req.path.replace(/^\/assets\/+/, "")
  const object = await c.env.OTA_BUCKET.get(key)

  if (!object) {
    return c.text("Not found", 404)
  }

  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.set("cache-control", IMMUTABLE_ASSET_CACHE_CONTROL)

  return new Response(object.body, {
    status: 200,
    headers,
  })
})

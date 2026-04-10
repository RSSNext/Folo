import { Hono } from "hono"

import type { Env } from "../env"
import { KV_KEYS } from "../lib/constants"
import { syncGitHubReleases } from "../lib/sync"

export const internalRoute = new Hono<{ Bindings: Env }>()

internalRoute.post("/internal/sync", async (c) => {
  const token = c.req.header(c.env.OTA_SYNC_TOKEN_HEADER)

  if (token !== c.env.OTA_SYNC_TOKEN) {
    return c.json({ error: "Unauthorized" }, 401)
  }

  await syncGitHubReleases(c.env)

  return c.json({ ok: true })
})

internalRoute.get("/internal/health", async (c) => {
  const lastSuccessAt = await c.env.OTA_KV.get<string>(KV_KEYS.syncLastSuccessAt)

  return c.json({
    ok: true,
    lastSuccessAt: lastSuccessAt ?? null,
  })
})

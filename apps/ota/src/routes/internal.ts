import { Hono } from "hono"

import type { Env } from "../env"
import { KV_KEYS } from "../lib/constants"
import { syncGitHubReleases, syncStoreVersions } from "../lib/sync"

export const internalRoute = new Hono<{ Bindings: Env }>()

internalRoute.post("/internal/sync", async (c) => {
  const token = c.req.header(c.env.OTA_SYNC_TOKEN_HEADER)

  if (token !== c.env.OTA_SYNC_TOKEN) {
    return c.json({ error: "Unauthorized" }, 401)
  }

  await Promise.all([syncGitHubReleases(c.env), syncStoreVersions(c.env)])

  return c.json({ ok: true })
})

internalRoute.get("/internal/health", async (c) => {
  const [lastSuccessAt, storeVersionLastSuccessAt] = await Promise.all([
    c.env.OTA_KV.get<string>(KV_KEYS.syncLastSuccessAt),
    c.env.OTA_KV.get<string>(KV_KEYS.storeVersionSyncLastSuccessAt),
  ])

  return c.json({
    ok: true,
    lastSuccessAt: lastSuccessAt ?? null,
    storeVersionLastSuccessAt: storeVersionLastSuccessAt ?? null,
  })
})

import { Hono } from "hono"

import type { Env } from "../env"
import { KV_KEYS } from "../lib/constants"
import { syncGitHubReleases, syncStoreVersions } from "../lib/sync"

export const internalRoute = new Hono<{ Bindings: Env }>()

const encoder = new TextEncoder()

// Compares in time independent of where the values differ
const isSameToken = (left: string, right: string) => {
  const a = encoder.encode(left)
  const b = encoder.encode(right)
  let difference = a.length ^ b.length
  for (let index = 0; index < Math.max(a.length, b.length); index++) {
    difference |= (a[index] ?? 0) ^ (b[index] ?? 0)
  }
  return difference === 0
}

internalRoute.post("/internal/sync", async (c) => {
  const token = c.req.header(c.env.OTA_SYNC_TOKEN_HEADER)
  const expectedToken = c.env.OTA_SYNC_TOKEN

  // A deployment without the secret must not let anyone start a sync
  if (!expectedToken || !token || !isSameToken(token, expectedToken)) {
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

import { Hono } from "hono"
import type { z } from "zod"

import type { Env } from "../env"
import { KV_KEYS } from "../lib/constants"
import { evaluateStorePolicy } from "../lib/policy"
import type { OtaRelease } from "../lib/schema"
import { otaReleaseSchema } from "../lib/schema"

const storePolicyReleaseSchema = otaReleaseSchema.pick({
  releaseVersion: true,
  releaseKind: true,
  runtimeVersion: true,
  policy: true,
})
type StorePolicyRelease = z.infer<typeof storePolicyReleaseSchema>

const OTA_PRODUCTS = ["mobile", "desktop"] as const

export const policyRoute = new Hono<{ Bindings: Env }>()

policyRoute.get("/policy", async (c) => {
  const product = parseProduct(c.req.query("product"))
  const channel = c.req.query("channel") ?? "production"
  const installedBinaryVersion = c.req.query("installedBinaryVersion")

  if (!product) {
    return c.json({ error: "Invalid product query parameter" }, 400)
  }

  if (!installedBinaryVersion) {
    return c.json({ error: "Missing installedBinaryVersion query parameter" }, 400)
  }

  const latestStoreReleaseRecord = await c.env.OTA_KV.get(KV_KEYS.policy(product, channel), "json")
  const parsedStoreRelease = storePolicyReleaseSchema.safeParse(latestStoreReleaseRecord)
  const latestStoreRelease: StorePolicyRelease | null = parsedStoreRelease.success
    ? parsedStoreRelease.data
    : null

  return c.json(
    evaluateStorePolicy(latestStoreRelease, {
      installedBinaryVersion,
    }),
  )
})

function parseProduct(value: string | undefined): OtaRelease["product"] | null {
  if (value === undefined) {
    return "mobile"
  }

  return OTA_PRODUCTS.find((product) => product === value) ?? null
}

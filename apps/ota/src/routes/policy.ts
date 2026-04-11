import { Hono } from "hono"
import { z } from "zod"

import type { Env } from "../env"
import { KV_KEYS } from "../lib/constants"
import { evaluateStorePolicy } from "../lib/policy"
import type { OtaRelease } from "../lib/schema"

const storePolicyReleaseSchema = z.object({
  releaseVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
  releaseKind: z.enum(["ota", "store"]),
  runtimeVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
  policy: z.object({
    storeRequired: z.boolean(),
    minSupportedBinaryVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
    message: z.string().nullable(),
  }),
})
type StorePolicyRelease = z.infer<typeof storePolicyReleaseSchema>
const OTA_PRODUCTS = ["mobile", "desktop"] as const
const semverSchema = z.string().regex(/^\d+\.\d+\.\d+$/)

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

  if (!semverSchema.safeParse(installedBinaryVersion).success) {
    return c.json({ error: "Invalid installedBinaryVersion query parameter" }, 400)
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

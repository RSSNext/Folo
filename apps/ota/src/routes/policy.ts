import { Hono } from "hono"

import type { Env } from "../env"
import { KV_KEYS } from "../lib/constants"
import { evaluateStorePolicy } from "../lib/policy"
import type { OtaRelease } from "../lib/schema"

type StorePolicyRelease = Pick<
  OtaRelease,
  "releaseVersion" | "releaseKind" | "runtimeVersion" | "policy"
>

const OTA_PRODUCTS = ["mobile", "desktop"] as const

export const policyRoute = new Hono<{ Bindings: Env }>()

policyRoute.get("/policy", async (c) => {
  const product = parseProduct(c.req.query("product"))
  const channel = c.req.query("channel") ?? "production"
  const installedBinaryVersion = c.req.query("installedBinaryVersion") ?? "0.0.0"
  const latestStoreRelease = await c.env.OTA_KV.get<StorePolicyRelease>(
    KV_KEYS.policy(product, channel),
    "json",
  )

  return c.json(
    evaluateStorePolicy(latestStoreRelease, {
      installedBinaryVersion,
    }),
  )
})

function parseProduct(value: string | undefined): OtaRelease["product"] {
  return OTA_PRODUCTS.find((product) => product === value) ?? "mobile"
}

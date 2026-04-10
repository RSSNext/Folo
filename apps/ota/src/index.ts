import { Hono } from "hono"

import type { Env } from "./env"
import { assetsRoute } from "./routes/assets"
import { manifestRoute } from "./routes/manifest"
import { policyRoute } from "./routes/policy"

export const app = new Hono<{ Bindings: Env }>()

app.route("/", manifestRoute)
app.route("/", assetsRoute)
app.route("/", policyRoute)
app.get("/internal/health", (c) => c.json({ ok: true }))

export default {
  fetch: app.fetch,
}

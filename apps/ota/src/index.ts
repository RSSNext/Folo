import { Hono } from "hono"

import type { Env } from "./env"

const app = new Hono<{ Bindings: Env }>()

app.get("/internal/health", (c) => c.json({ ok: true }))

export default {
  fetch: app.fetch,
}

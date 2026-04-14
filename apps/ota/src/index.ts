import { Hono } from "hono"

import type { Env } from "./env"
import { syncGitHubReleases, syncStoreVersions } from "./lib/sync"
import { assetsRoute } from "./routes/assets"
import { internalRoute } from "./routes/internal"
import { manifestRoute } from "./routes/manifest"
import { policyRoute } from "./routes/policy"
import { versionsRoute } from "./routes/versions"

export const app = new Hono<{ Bindings: Env }>()

app.route("/", manifestRoute)
app.route("/", assetsRoute)
app.route("/", policyRoute)
app.route("/", versionsRoute)
app.route("/", internalRoute)

export default {
  fetch: app.fetch,
  scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(Promise.all([syncGitHubReleases(env), syncStoreVersions(env)]))
  },
}

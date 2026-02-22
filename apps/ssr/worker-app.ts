import { fastifyRequestContext } from "@fastify/request-context"
import { env } from "@follow/shared/env.ssr"
import type { FastifyRequest } from "fastify"
import Fastify from "fastify"
import { nanoid } from "nanoid"
import { FetchError } from "ofetch"

import { MetaError } from "./src/meta-handler"
import { globalRoute } from "./src/router/global"
import { ogRoute } from "./src/router/og"

declare module "@fastify/request-context" {
  interface RequestContextData {
    req: FastifyRequest
    upstreamEnv: "prod" | "dev"
    upstreamOrigin: string
  }
}

export const createApp = () => {
  const app = Fastify({})

  // Test: minimal route to verify Fastify works in Workers
  app.get("/healthz", async () => ({ ok: true }))

  app.register(fastifyRequestContext)

  app.after(() => {
    app.setErrorHandler(function (err, req, reply) {
      this.log.error(err)

      const traceId = nanoid(8)

      if (err instanceof FetchError) {
        reply
          .status((err as FetchError).response?.status || 500)
          .send({ ok: false, traceId, message: err.message })
      } else if (err instanceof MetaError) {
        reply.status(err.status).send({ ok: false, traceId, message: err.metaMessage })
      } else {
        const message = (err as any).message || "Internal Server Error"
        const status = Number.parseInt((err as any).code as string) || 500
        reply.status(status).send({ ok: false, message, traceId })
      }
    })

    app.addHook("onRequest", (req, reply, done) => {
      req.requestContext.set("req", req)

      const { host } = req.headers

      const forwardedHost = req.headers["x-forwarded-host"]
      const finalHost = forwardedHost || host

      const upstreamEnv = finalHost?.includes("dev") ? "dev" : "prod"
      req.requestContext.set("upstreamEnv", upstreamEnv)
      if (upstreamEnv === "prod") {
        req.requestContext.set("upstreamOrigin", env.VITE_WEB_PROD_URL || env.VITE_WEB_URL)
      } else {
        req.requestContext.set("upstreamOrigin", env.VITE_WEB_DEV_URL || env.VITE_WEB_URL)
      }
      reply.header("x-handled-host", finalHost)
      done()
    })

    ogRoute(app)
    globalRoute(app)
  })

  return app
}

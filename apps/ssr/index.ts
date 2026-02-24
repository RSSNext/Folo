import "./global"
import "./src/lib/load-env"

import os from "node:os"

import middie from "@fastify/middie"
import { fastifyRequestContext } from "@fastify/request-context"
import type { FastifyRequest } from "fastify"
import Fastify from "fastify"
import { nanoid } from "nanoid"
import { FetchError } from "ofetch"

import { APPLE_APP_SITE_ASSOCIATION } from "./src/lib/apple-app-site-association"
import { MetaError } from "./src/meta-handler"
import { globalRoute } from "./src/router/global"
import { ogRoute } from "./src/router/og"

const isVercel = process.env.VERCEL === "1"

declare module "@fastify/request-context" {
  interface RequestContextData {
    req: FastifyRequest
  }
}

export const createApp = async () => {
  const app = Fastify({})

  app.register(fastifyRequestContext)
  await app.register(middie, {
    hook: "onRequest",
  })

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

    reply.header("x-handled-host", finalHost)
    done()
  })

  app.get("/.well-known/apple-app-site-association", async (_req, reply) => {
    return reply
      .type("application/json")
      .header("Cache-Control", "public, max-age=300")
      .send(APPLE_APP_SITE_ASSOCIATION)
  })

  app.get("/apple-app-site-association", async (_req, reply) => {
    return reply
      .type("application/json")
      .header("Cache-Control", "public, max-age=300")
      .send(APPLE_APP_SITE_ASSOCIATION)
  })

  if (__DEV__) {
    const devVite = await import("./src/lib/dev-vite")
    await devVite.registerDevViteServer(app)
  }

  ogRoute(app)
  globalRoute(app)

  return app
}

if (!isVercel) {
  createApp().then(async (app) => {
    await app.listen({ port: 2234, host: "0.0.0.0" })
    console.info("Server is running on http://localhost:2234")
    const ip = getIPAddress()

    if (ip) console.info(`Server is running on http://${ip}:2234`)
  })
}

function getIPAddress() {
  const interfaces = os.networkInterfaces()
  for (const devName in interfaces) {
    const iface = interfaces[devName]

    for (const alias of iface || []) {
      if (alias.family === "IPv4" && alias.address !== "127.0.0.1" && !alias.internal)
        return alias.address
    }
  }
  return "0.0.0.0"
}

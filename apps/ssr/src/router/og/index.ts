import { Readable } from "node:stream"

import type { FastifyInstance, FastifyReply } from "fastify"

import { createApiClient } from "~/lib/api-client"

import { renderFeedOG } from "./feed"
import { renderListOG } from "./list"
import { renderUserOG } from "./user"

export const ogRoute = (app: FastifyInstance) => {
  app.get("/og/:type/:id", async (req, reply) => {
    const { type, id } = req.params as Record<string, string>

    const apiClient = createApiClient()
    let imageRes: {
      image: Buffer
      contentType: string
    } | null = null
    const errorFallback = createErrorFallback(reply)

    switch (type) {
      case "feed": {
        imageRes = await renderFeedOG(apiClient, id!).catch(errorFallback)

        break
      }
      case "user": {
        imageRes = await renderUserOG(apiClient, id!).catch(errorFallback)
        break
      }
      case "list": {
        imageRes = await renderListOG(apiClient, id!).catch(errorFallback)
        break
      }
      default: {
        return reply.code(404).send("Not found")
      }
    }

    if (!imageRes) {
      if (!reply.sent) {
        return reply.code(404).send("Not found")
      }
      return
    }

    const stream = new Readable({
      read() {
        this.push(imageRes.image)
        this.push(null)
      },
    })

    reply.type(imageRes.contentType).headers({
      "Cache-Control": "max-age=3600, s-maxage=3600, stale-while-revalidate=600",
      "Cloudflare-CDN-Cache-Control": "max-age=3600, s-maxage=3600, stale-while-revalidate=600",
      "CDN-Cache-Control": "max-age=3600, s-maxage=3600, stale-while-revalidate=600",
    })
    return reply.send(stream)
  })
}

const createErrorFallback = (reply: FastifyReply) => (code: number) => {
  reply.code(code).send("Internal server error")
  return null
}

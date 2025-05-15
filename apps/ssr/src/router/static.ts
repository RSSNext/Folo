import { legalHtml } from "@follow/legal"
import type { FastifyInstance } from "fastify"

export const staticRoute = (app: FastifyInstance) => {
  app.get("/privacy-policy", (req, res) => {
    res.type("text/html")
    res.send(legalHtml.privacy)
  })
  app.get("/terms", (req, res) => {
    res.type("text/html")
    res.send(legalHtml.tos)
  })
}

import type { FastifyReply, FastifyRequest } from "fastify"
import { match } from "path-to-regexp"

import type { ApiClient } from "./lib/api-client"
import { createApiClient } from "./lib/api-client"
import importer from "./meta-handler.map"

interface MetaTagdata {
  type: "meta"
  property: string
  content: string
}

interface MetaOpenGraph {
  type: "openGraph"
  title: string
  description?: string
  image?: string | null
}

interface MetaTitle {
  type: "title"
  title: string
}

interface MetaDescription {
  type: "description"
  description: string
}

interface MetaHydrateData {
  type: "hydrate"
  data: any
  path: string
  key: string
}
export type MetaTag = MetaTagdata | MetaOpenGraph | MetaTitle | MetaHydrateData | MetaDescription

export async function injectMetaHandler(
  req: FastifyRequest,
  res: FastifyReply,
): Promise<MetaTag[]> {
  const apiClient = createApiClient()
  const upstreamOrigin = req.requestContext.get("upstreamOrigin")
  const url = req.originalUrl

  for (const [pattern, handler] of Object.entries(importer)) {
    const matchFn = match(pattern, { decode: decodeURIComponent })
    const parsedUrl = new URL(url, upstreamOrigin)
    const result = matchFn(parsedUrl.pathname)

    if (result) {
      return (await handler({
        params: result.params as Record<string, string>,
        searchParams: parsedUrl.searchParams,
        url: parsedUrl,
        req,
        apiClient,
        origin: upstreamOrigin || "",
        setStatus(status) {
          res.status(status)
        },
        setStatusText(statusText) {
          res.raw.statusMessage = statusText
        },
        throwError(status, message) {
          throw new MetaError(status, message)
        },
      })) as MetaTag[]
    }
  }

  return []
}

export function defineMetadata<Params extends Record<string, string>, T extends readonly MetaTag[]>(
  fn: (args: {
    req: FastifyRequest
    url: URL
    params: Params
    apiClient: ApiClient
    searchParams: URLSearchParams
    origin: string
    setStatus: (status: number) => void
    setStatusText: (statusText: string) => void
    throwError: (status: number, message: any) => never
  }) => Promise<T> | T,
) {
  return fn
}
export class MetaError extends Error {
  status: number
  metaMessage: object
  constructor(status: number, message: object) {
    super("Meta Error")
    this.status = status
    this.metaMessage = message
  }
}

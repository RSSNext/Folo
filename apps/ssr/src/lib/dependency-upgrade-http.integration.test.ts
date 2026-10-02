import { createHmac } from "node:crypto"
import { createServer, request as httpRequest } from "node:http"
import type { AddressInfo } from "node:net"

import middie from "@fastify/middie"
import { fastifyRequestContext } from "@fastify/request-context"
import type { VercelRequest, VercelResponse } from "@vercel/node"
import Fastify from "fastify"
import getRawBody from "raw-body"
import { afterEach, describe, expect, it, vi } from "vitest"

import webhook from "../../../../api/vercel_webhook"

const cleanup: Array<() => Promise<void>> = []
afterEach(async () => {
  await Promise.all(cleanup.splice(0).map((close) => close()))
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe("upgraded HTTP dependency contracts", () => {
  it("preserves SSR middleware, isolated request context, HTML and not-found hooks over HTTP", async () => {
    const app = Fastify()
    cleanup.push(() => app.close())
    app.register(fastifyRequestContext)
    await app.register(middie, { hook: "onRequest" })
    app.use((_request, response, next) => {
      response.setHeader("x-middleware", "active")
      next()
    })
    app.addHook("onRequest", (request, _reply, done) => {
      request.requestContext.set("req", request)
      done()
    })
    app.get("/page/:id", async (request, reply) => {
      await new Promise((resolve) => setImmediate(resolve))
      reply.header("x-removed", "discard")
      reply.removeHeader("x-removed")
      return reply.type("text/html").send(`<main>${request.requestContext.get("req")?.url}</main>`)
    })
    app.setNotFoundHandler(
      {
        preHandler: (_request, reply, done) => {
          reply.header("x-not-found-hook", "active")
          done()
        },
      },
      (_request, reply) => reply.code(404).send("missing"),
    )
    app.get("/delegate-404", (_request, reply) => reply.callNotFound())
    const address = await app.listen({ port: 0, host: "127.0.0.1" })
    const responses = await Promise.all(["one", "two"].map((id) => fetch(`${address}/page/${id}`)))
    expect(await Promise.all(responses.map((response) => response.text()))).toEqual([
      "<main>/page/one</main>",
      "<main>/page/two</main>",
    ])
    for (const response of responses) {
      expect(response.headers.get("content-type")).toContain("text/html")
      expect(response.headers.get("x-middleware")).toBe("active")
      expect(response.headers.has("x-removed")).toBe(false)
    }
    const missing = await fetch(`${address}/delegate-404`)
    expect(missing.status).toBe(404)
    expect(missing.headers.get("x-not-found-hook")).toBe("active")
  })

  it("parses quoted JSON content types and preserves falsy JSON bodies", async () => {
    const app = Fastify()
    cleanup.push(() => app.close())
    app.post("/json", (request, reply) => reply.send({ body: request.body }))
    const address = await app.listen({ port: 0, host: "127.0.0.1" })
    for (const body of [false, 0, ""]) {
      const response = await fetch(`${address}/json`, {
        method: "POST",
        headers: { "content-type": 'application/json; profile="a;b"; charset=utf-8' },
        body: JSON.stringify(body),
      })
      expect(response.status).toBe(200)
      expect(await response.json()).toEqual({ body })
    }
  })

  it("verifies the actual Vercel webhook signature over unchanged chunked UTF-8 bytes", async () => {
    const secret = "local-webhook-integration-only"
    vi.stubEnv("WEBHOOK_SECRET", secret)
    vi.spyOn(console, "info").mockImplementation(() => {})
    const server = createServer((request, response) => {
      const vercelResponse = Object.assign(response, {
        status(code: number) {
          response.statusCode = code
          return vercelResponse
        },
        json(body: unknown) {
          response.end(JSON.stringify(body))
          return vercelResponse
        },
      })
      void webhook(request as VercelRequest, vercelResponse as VercelResponse).catch((error) => {
        response.statusCode = 500
        response.end(String(error))
      })
    })
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve))
    cleanup.push(
      () =>
        new Promise<void>((resolve, reject) =>
          server.close((error) => (error ? reject(error) : resolve())),
        ),
    )
    const port = (server.address() as AddressInfo).port
    const body = Buffer.from(
      JSON.stringify({
        type: "deployment.succeeded",
        payload: { target: "staging", name: "订阅✓" },
      }),
    )
    const signature = createHmac("sha1", secret).update(body).digest("hex")
    const send = (signatureValue: string) =>
      new Promise<number>((resolve, reject) => {
        const request = httpRequest(
          {
            hostname: "127.0.0.1",
            port,
            method: "POST",
            headers: { "x-vercel-signature": signatureValue },
          },
          (response) => {
            response.resume()
            response.on("end", () => resolve(response.statusCode!))
          },
        )
        request.on("error", reject)
        for (let index = 0; index < body.length; index += 2)
          request.write(body.subarray(index, index + 2))
        request.end()
      })
    expect(await send(signature)).toBe(200)
    expect(await send(`${signature.slice(0, -1)}${signature.endsWith("0") ? "1" : "0"}`)).toBe(403)
  })

  it("settles an aborted raw request instead of leaving the webhook waiting", async () => {
    let finish: (value: unknown) => void = () => {}
    const result = new Promise<unknown>((resolve) => {
      finish = resolve
    })
    const server = createServer((request) => {
      void getRawBody(request).then(finish, finish)
      request.once("data", () => request.destroy())
    })
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve))
    cleanup.push(() => new Promise<void>((resolve) => server.close(() => resolve())))
    const request = httpRequest({
      hostname: "127.0.0.1",
      port: (server.address() as AddressInfo).port,
      method: "POST",
      headers: { "content-length": "100" },
    })
    request.on("error", () => {})
    request.write("partial")
    expect(await result).toMatchObject({ type: "request.aborted" })
    request.destroy()
  })
})

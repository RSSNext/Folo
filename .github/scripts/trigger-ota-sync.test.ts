import { createServer } from "node:http"

import { afterEach, describe, expect, it } from "vitest"

const activeServers = new Set<ReturnType<typeof createServer>>()

afterEach(async () => {
  await Promise.all(
    Array.from(
      activeServers,
      (server) =>
        new Promise<void>((resolve, reject) => {
          server.close((error) => {
            if (error) {
              reject(error)
              return
            }

            resolve()
          })
        }),
    ),
  )
  activeServers.clear()
})

describe("triggerOtaSync", () => {
  it("POSTs to /internal/sync with the configured auth header", async () => {
    const requests: Array<{ method?: string; url?: string; headerValue?: string }> = []
    const headerName = "x-ota-sync-token"
    const token = "sync-token-value"

    const server = createServer((request, response) => {
      requests.push({
        method: request.method,
        url: request.url,
        headerValue: request.headers[headerName],
      })

      response.writeHead(204)
      response.end()
    })

    activeServers.add(server)

    await new Promise<void>((resolve, reject) => {
      server.once("error", reject)
      server.listen(0, "127.0.0.1", resolve)
    })

    const address = server.address()
    if (!address || typeof address === "string") {
      throw new TypeError("Expected the test server to bind to an ephemeral TCP port")
    }

    const { triggerOtaSync } = await import("./trigger-ota-sync.mjs")

    await triggerOtaSync({
      baseUrl: `http://127.0.0.1:${address.port}`,
      token,
      headerName,
    })

    expect(requests).toEqual([
      {
        method: "POST",
        url: "/internal/sync",
        headerValue: token,
      },
    ])
  })

  it("throws when the sync endpoint responds with a non-OK status", async () => {
    const headerName = "x-ota-sync-token"
    const token = "sync-token-value"

    const server = createServer((_request, response) => {
      response.writeHead(503, { "content-type": "text/plain" })
      response.end("service unavailable")
    })

    activeServers.add(server)

    await new Promise<void>((resolve, reject) => {
      server.once("error", reject)
      server.listen(0, "127.0.0.1", resolve)
    })

    const address = server.address()
    if (!address || typeof address === "string") {
      throw new TypeError("Expected the test server to bind to an ephemeral TCP port")
    }

    const { triggerOtaSync } = await import("./trigger-ota-sync.mjs")

    await expect(
      triggerOtaSync({
        baseUrl: `http://127.0.0.1:${address.port}`,
        token,
        headerName,
      }),
    ).rejects.toThrow("Failed to trigger OTA sync (503 Service Unavailable): service unavailable")
  })

  it("aborts the request when the timeout is exceeded", async () => {
    const headerName = "x-ota-sync-token"
    const token = "sync-token-value"

    const server = createServer((_request, _response) => {
      // Intentionally never respond so the client must rely on the timeout.
    })

    activeServers.add(server)

    await new Promise<void>((resolve, reject) => {
      server.once("error", reject)
      server.listen(0, "127.0.0.1", resolve)
    })

    const address = server.address()
    if (!address || typeof address === "string") {
      throw new TypeError("Expected the test server to bind to an ephemeral TCP port")
    }

    const { triggerOtaSync } = await import("./trigger-ota-sync.mjs")

    await expect(
      triggerOtaSync({
        baseUrl: `http://127.0.0.1:${address.port}`,
        token,
        headerName,
        timeoutMs: 25,
      }),
    ).rejects.toThrow("Timed out while triggering OTA sync after 25ms")
  })
})

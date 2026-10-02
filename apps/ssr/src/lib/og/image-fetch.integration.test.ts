import { createServer } from "node:http"
import type { AddressInfo } from "node:net"

import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { getImageBase64 } from "../../router/og/__base"

describe("OG remote image fallback", () => {
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aFhoAAAAASUVORK5CYII=",
    "base64",
  )
  const server = createServer((req, res) => {
    if (req.url === "/slow") return
    if (req.url === "/disconnect") return req.socket.destroy()
    if (req.url === "/html") {
      res.writeHead(200, { "content-type": "text/html" })
      return res.end("<html>Not an image</html>")
    }
    res.writeHead(req.url === "/missing" ? 404 : 200, { "content-type": "image/png" })
    res.end(png)
  })
  let origin: string

  beforeAll(async () => {
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve))
    origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
  })
  afterAll(async () => {
    server.closeAllConnections()
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    )
  })

  it("embeds valid images and rejects HTTP errors, HTML and interrupted responses", async () => {
    expect(await getImageBase64(`${origin}/image`)).toBe(
      `data:image/png;base64,${png.toString("base64")}`,
    )
    for (const path of ["/missing", "/html", "/disconnect"]) {
      expect(await getImageBase64(`${origin}${path}`)).toBeNull()
    }
    expect(await getImageBase64("invalid-url")).toBeNull()
    expect(await getImageBase64(null)).toBeNull()
  })

  it("falls back when a remote image never responds", async () => {
    const started = performance.now()
    expect(await getImageBase64(`${origin}/slow`)).toBeNull()
    expect(performance.now() - started).toBeLessThan(8000)
  }, 10000)
})

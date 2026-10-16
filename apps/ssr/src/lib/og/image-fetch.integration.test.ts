import { createServer } from "node:http"
import type { AddressInfo } from "node:net"

import type { FollowClient } from "@follow-app/client-sdk"
import { FollowAPIError } from "@follow-app/client-sdk"
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"

import { getImageBase64 } from "../../router/og/__base"
import { renderFeedOG } from "../../router/og/feed"

// Build-time define read by the shared constants the feed renderer imports
vi.hoisted(() => {
  ;(globalThis as { ELECTRON?: boolean }).ELECTRON = false
})

describe("OG remote image fallback", () => {
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aFhoAAAAASUVORK5CYII=",
    "base64",
  )
  const server = createServer((req, res) => {
    if (req.url === "/slow") return
    if (req.url === "/disconnect") return req.socket.destroy()
    if (req.url === "/favicon.ico") {
      res.writeHead(200, { "content-type": "image/x-icon" })
      return res.end(Buffer.from([0, 0, 1, 0, 1, 0, 16, 16]))
    }
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
    for (const path of ["/missing", "/html", "/disconnect", "/favicon.ico"]) {
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

  const createClient = (get: () => Promise<unknown>) =>
    ({ api: { feeds: { get } } }) as unknown as FollowClient

  it("renders a feed preview with initials when its icon is an ICO favicon", async () => {
    const result = await renderFeedOG(
      createClient(async () => ({
        data: {
          feed: {
            title: "Hacker News",
            description: "Links for the intellectually curious",
            image: `${origin}/favicon.ico`,
            siteUrl: "https://news.ycombinator.com",
          },
          subscriptionCount: 1,
          readCount: 2,
        },
      })),
      "feed-1",
    )

    expect(result?.contentType).toBe("image/png")
  }, 20000)

  it("answers 404 only for a missing feed", async () => {
    await expect(
      renderFeedOG(
        createClient(async () => {
          throw new FollowAPIError("Not found", 404)
        }),
        "feed-1",
      ),
    ).rejects.toBe(404)
    await expect(
      renderFeedOG(
        createClient(async () => {
          throw new FollowAPIError("Internal error", 500)
        }),
        "feed-1",
      ),
    ).rejects.toBeInstanceOf(FollowAPIError)
  })
})

import crypto from "node:crypto"

import type { VercelRequest, VercelResponse } from "@vercel/node"
import getRawBody from "raw-body"

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const { WEBHOOK_SECRET: INTEGRATION_SECRET } = process.env

  if (typeof INTEGRATION_SECRET != "string") {
    return response.status(400).json({
      code: "invalid_secret",
      error: "No integration secret found",
    })
  }

  const rawBody = await getRawBody(request)
  const bodySignature = sha1(rawBody, INTEGRATION_SECRET)

  if (bodySignature !== request.headers["x-vercel-signature"]) {
    return response.status(403).json({
      code: "invalid_signature",
      error: "signature didn't match",
    })
  }

  const json = JSON.parse(rawBody.toString("utf-8"))

  switch (json.type) {
    // https://vercel.com/docs/observability/webhooks-overview/webhooks-api#deployment.succeeded
    case "deployment.succeeded": {
      const { target } = json.payload || json.data

      if (target === "production") {
        await purgeCloudflareCache()
      } else {
        console.info(`Skipping non-production deployment: ${target}`, json)
      }
    }
    // ...
  }

  return response.status(200).end("OK")
}

function sha1(data: Buffer, secret: string): string {
  return crypto.createHmac("sha1", secret).update(data).digest("hex")
}

export const config = {
  api: {
    bodyParser: false,
  },
}

async function purgeCloudflareCache() {
  const { CF_TOKEN, CF_ZONE_ID } = process.env

  if (typeof CF_TOKEN !== "string" || typeof CF_ZONE_ID !== "string") {
    throw new TypeError("No Cloudflare token or zone ID found")
  }

  const apiUrl = `https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/purge_cache`

  const manifestPath = await fetch(`https://app.folo.is/assets/manifest.txt?t=${Date.now()}`).then(
    (res) => res.text(),
  )

  try {
    await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: CF_TOKEN,
      },
      body: JSON.stringify({
        tags: ["follow-assets"],
      }),
    })

    console.info("Successfully purged Cloudflare cache")
  } catch {
    console.error("Failed to purge Cloudflare cache by tags, fallback to purge by files")
    const allPath = manifestPath.split("\n").map((path) => `https://app.folo.is/${path}`)

    // Function to delay execution
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

    const taskPromise = [] as Promise<Response>[]
    // Batch processing
    for (let i = 0; i < allPath.length; i += 30) {
      const batch = allPath.slice(i, i + 30)

      const r = fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: CF_TOKEN,
        },
        body: JSON.stringify({
          files: batch,
        }),
      })

      taskPromise.push(r)

      // Delay for 0.5 seconds between batches
      if (i + 30 < allPath.length) {
        await delay(500)
      }
    }

    const result = await Promise.allSettled(taskPromise)
    console.info(`Success: ${result.filter((r) => r.status === "fulfilled").length}`)
    console.info(`Failed: ${result.filter((r) => r.status === "rejected").length}`)
  }
}

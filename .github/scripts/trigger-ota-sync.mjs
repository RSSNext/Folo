#!/usr/bin/env node

import { pathToFileURL } from "node:url"

/**
 * @typedef {{
 *   baseUrl: string
 *   token: string
 *   headerName: string
 *   timeoutMs?: number
 * }} TriggerOtaSyncOptions
 */

const DEFAULT_TIMEOUT_MS = 10_000

/**
 * @param {TriggerOtaSyncOptions} options
 */
export async function triggerOtaSync({
  baseUrl,
  token,
  headerName,
  timeoutMs = DEFAULT_TIMEOUT_MS,
}) {
  if (!baseUrl) {
    throw new TypeError("OTA base URL is required")
  }

  if (!token) {
    throw new TypeError("OTA sync token is required")
  }

  if (!headerName) {
    throw new TypeError("OTA sync header name is required")
  }

  if (!Number.isInteger(timeoutMs) || timeoutMs <= 0) {
    throw new TypeError("OTA sync timeout must be a positive integer")
  }

  const normalizedBaseUrl = baseUrl.replace(/\/+$/, "")
  const controller = new AbortController()
  const timeoutError = new Error(`Timed out while triggering OTA sync after ${timeoutMs}ms`)
  const timeoutId = setTimeout(() => {
    controller.abort(timeoutError)
  }, timeoutMs)

  try {
    const response = await fetch(`${normalizedBaseUrl}/internal/sync`, {
      method: "POST",
      headers: {
        [headerName]: token,
      },
      signal: controller.signal,
    })

    if (!response.ok) {
      const responseText = await response.text()
      const detail = responseText ? `: ${responseText}` : ""

      throw new Error(
        `Failed to trigger OTA sync (${response.status} ${response.statusText})${detail}`,
      )
    }

    return response
  } catch (error) {
    if (controller.signal.aborted && controller.signal.reason === timeoutError) {
      throw timeoutError
    }

    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

async function main() {
  try {
    await triggerOtaSync({
      baseUrl: process.env.OTA_BASE_URL ?? "",
      token: process.env.OTA_SYNC_TOKEN ?? "",
      headerName: process.env.OTA_SYNC_TOKEN_HEADER ?? "",
    })

    console.info("Triggered OTA sync successfully")
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main()
}

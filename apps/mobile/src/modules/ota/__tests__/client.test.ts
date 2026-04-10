import { beforeEach, describe, expect, it, vi } from "vitest"

import { fetchStorePolicy } from "../client"

describe("fetchStorePolicy", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ action: "block", targetVersion: "0.4.3", message: "Update required" }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        ),
      ),
    )
  })

  it("returns the parsed policy response", async () => {
    const result = await fetchStorePolicy({
      baseUrl: "https://ota.folo.is",
      product: "mobile",
      channel: "production",
      installedBinaryVersion: "0.4.1",
    })

    expect(result.action).toBe("block")
    expect(result.targetVersion).toBe("0.4.3")
  })

  it("throws when the policy request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: "Internal Server Error" }), {
          status: 500,
          headers: { "content-type": "application/json" },
        }),
      ),
    )

    await expect(
      fetchStorePolicy({
        baseUrl: "https://ota.folo.is",
        product: "mobile",
        channel: "production",
        installedBinaryVersion: "0.4.1",
      }),
    ).rejects.toThrow("Failed to fetch OTA policy")
  })
})

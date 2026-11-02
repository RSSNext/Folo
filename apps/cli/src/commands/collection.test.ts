import { describe, expect, it, vi } from "vitest"

import type { APIRequest } from "../test-utils"
import { parseEnvelope, runCLIWithAPI } from "../test-utils"

// Keeps the user's stored token and API URL out of the commands
vi.mock("../config", () => ({ readConfig: async () => ({}) }))

/** The API of a user who collected entry "1": success with a sync id for every change */
const answerCollections = (request: APIRequest) =>
  request.method === "GET" && request.path === "/collections"
    ? { code: 0, data: request.query.entryId === "1" }
    : { code: 0, lastSyncId: 9 }

const changes = (requests: APIRequest[]) =>
  requests
    .filter((request) => request.method !== "GET")
    .map(({ method, path, body }) => ({ method, path, body }))

describe("collection remove", () => {
  it.each(["2", "999999999999999999", "not-an-id"])(
    "fails for %s, which is not collected, without changing anything",
    async (entryId) => {
      // The API answers such a removal with success and records it for every device to sync
      const { requests, stdout, stderr, exitCode } = await runCLIWithAPI(
        ["collection", "remove", entryId],
        answerCollections,
      )

      expect(requests).toMatchObject([{ method: "GET", path: "/collections", query: { entryId } }])
      expect(changes(requests)).toEqual([])
      expect(stdout).toBe("")
      expect(parseEnvelope(stderr)).toEqual({
        ok: false,
        data: null,
        error: { code: "NOT_FOUND", message: `Entry ${entryId} is not in your collection.` },
      })
      expect(exitCode).toBe(1)
    },
  )

  it("removes a collected entry", async () => {
    const { requests, stdout, exitCode } = await runCLIWithAPI(
      ["collection", "remove", "1"],
      answerCollections,
    )

    expect(changes(requests)).toEqual([
      { method: "DELETE", path: "/collections", body: { entryId: "1" } },
    ])
    expect(parseEnvelope(stdout)).toEqual({ ok: true, data: { lastSyncId: 9 }, error: null })
    expect(exitCode).toBeUndefined()
  })
})

import { mkdtemp } from "node:fs/promises"
import { tmpdir } from "node:os"

import { FollowClient } from "@follow-app/client-sdk"
import { join } from "pathe"
import { describe, expect, it } from "vitest"

import { fetchOPMLExport, OPML_FILENAME, resolveOPMLOutputPath } from "./opml"

describe("fetchOPMLExport", () => {
  it("reads the OPML document the API answers with", async () => {
    const opml = '<?xml version="1.0" encoding="UTF-8"?>\n<opml version="2.0"></opml>'
    const requests: string[] = []
    const client = new FollowClient({
      baseURL: "http://api.test",
      fetch: (async (input: Parameters<typeof fetch>[0]) => {
        requests.push(String(input))
        return new Response(opml, {
          headers: { "content-type": "application/xml; charset=utf-8" },
        })
      }) as typeof fetch,
    })

    await expect(fetchOPMLExport(client)).resolves.toEqual({
      content: opml,
      contentType: "application/xml; charset=utf-8",
    })
    expect(requests).toEqual(["http://api.test/subscriptions/export"])
  })
})

describe("resolveOPMLOutputPath", () => {
  it("saves the export as folo.opml in a directory", async () => {
    const directory = await mkdtemp(join(tmpdir(), "folocli-opml-"))

    await expect(resolveOPMLOutputPath(directory)).resolves.toBe(join(directory, OPML_FILENAME))
    await expect(resolveOPMLOutputPath("backups/")).resolves.toBe(join("backups", OPML_FILENAME))
  })

  it("keeps a file name the user gave", async () => {
    const directory = await mkdtemp(join(tmpdir(), "folocli-opml-"))

    await expect(resolveOPMLOutputPath(join(directory, "backup.opml"))).resolves.toBe(
      join(directory, "backup.opml"),
    )
  })
})

import { describe, expect, it, vi } from "vitest"

import type { APIRequest } from "./test-utils"
import { parseEnvelope, runCLIWithAPI } from "./test-utils"

// Keeps the user's stored token and API URL out of the commands
vi.mock("./config", () => ({ readConfig: async () => ({}) }))

interface TimelineRow {
  id: string
  publishedAt: string
  onboarding?: boolean
}

interface PageData {
  entries: Array<{ entries: { id: string; publishedAt: string } }>
  nextCursor: string | null
  hasNext: boolean
}

const minute = (index: number) => new Date(Date.UTC(2026, 9, 17, 12, 0) - index * 60_000)

/** Timeline rows newest first, one a minute */
const createRows = (count: number, onboarding: number[] = []): TimelineRow[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `e${index}`,
    publishedAt: minute(index).toISOString(),
    onboarding: onboarding.includes(index),
  }))

/**
 * POST /entries as the API answers it: at most 100 rows between the times asked for, and the
 * rows of the onboarding feed left out after the query was limited
 */
const answerEntries = (rows: TimelineRow[]) => (request: APIRequest) => {
  const body = request.body as { limit?: number; publishedAfter?: string; publishedBefore?: string }
  const data = rows
    .filter((row) => !body.publishedAfter || row.publishedAt < body.publishedAfter)
    .filter((row) => !body.publishedBefore || row.publishedAt > body.publishedBefore)
    .slice(0, Math.min(body.limit ?? 20, 100))
    .filter((row) => !row.onboarding)
    .map((row) => ({
      read: false,
      feeds: { id: "f1", title: "Feed" },
      entries: { id: row.id, publishedAt: row.publishedAt },
      collections: { createdAt: row.publishedAt },
    }))
  return { code: 0, data }
}

/** Follows the documented loop: fetch pages until hasNext is false */
const readAllPages = async (command: string[], rows: TimelineRow[]) => {
  const ids: string[] = []
  let cursor: string | null = null
  for (let page = 0; page < 50; page += 1) {
    const { stdout } = await runCLIWithAPI(
      [...command, ...(cursor ? ["--cursor", cursor] : [])],
      answerEntries(rows),
    )
    const envelope = parseEnvelope<PageData>(stdout)
    if (!envelope.ok) {
      throw new Error(envelope.error.message)
    }
    ids.push(...envelope.data.entries.map((entry) => entry.entries.id))
    if (!envelope.data.hasNext) {
      return ids
    }
    cursor = envelope.data.nextCursor
  }
  throw new Error("The pages never ended")
}

describe.each([[["timeline"]], [["collection", "list"]]])("%s pages", (command) => {
  it("keep going after a page the API returned short or empty", async () => {
    // A new account: the onboarding rows were the newest when it signed up
    const rows = createRows(41, [0, 1, 2])

    for (const limit of ["1", "3", "5", "20"]) {
      const ids = await readAllPages([...command, "--limit", limit], rows)

      expect(ids, `--limit ${limit}`).toEqual(
        rows.filter((row) => !row.onboarding).map((row) => row.id),
      )
    }
  })

  it("end with an empty page", async () => {
    const { requests, stdout } = await runCLIWithAPI(
      [...command, "--cursor", minute(10).toISOString()],
      answerEntries(createRows(5)),
    )

    // Asked again for as many entries as the API returns, in case it left all out
    expect(requests.map((request) => (request.body as { limit: number }).limit)).toEqual([21, 100])
    expect(parseEnvelope(stdout)).toEqual({
      ok: true,
      data: { entries: [], nextCursor: null, hasNext: false },
      error: null,
    })
  })

  it("ask for at most 100 entries and still continue after them", async () => {
    const rows = createRows(130)

    const { requests, stdout } = await runCLIWithAPI(
      [...command, "--limit", "150"],
      answerEntries(rows),
    )

    expect(requests[0]).toMatchObject({ method: "POST", path: "/entries", body: { limit: 100 } })
    const envelope = parseEnvelope<PageData>(stdout)
    expect(envelope.ok && envelope.data.entries).toHaveLength(100)
    expect(envelope.ok && envelope.data.hasNext).toBe(true)
    expect(await readAllPages([...command, "--limit", "150"], rows)).toHaveLength(130)
  })

  it("return every entry of the time the page ends with", async () => {
    // Feed items dated in the future all get the time they were fetched at
    const future = minute(-10).toISOString()
    const rows: TimelineRow[] = [
      { id: "future2", publishedAt: future },
      { id: "future1", publishedAt: future },
      { id: "future0", publishedAt: future },
      ...createRows(3),
    ]

    for (const limit of ["1", "2", "3", "4"]) {
      const ids = await readAllPages([...command, "--limit", limit], rows)

      expect(ids, `--limit ${limit}`).toEqual(rows.map((row) => row.id))
    }
  })

  it("ask once per page when no time continues past it", async () => {
    const { requests, stdout } = await runCLIWithAPI(
      [...command, "--limit", "2"],
      answerEntries(createRows(5)),
    )

    expect(requests.map((request) => (request.body as { limit: number }).limit)).toEqual([3])
    const envelope = parseEnvelope<PageData>(stdout)
    expect(envelope.ok && envelope.data.entries.map((entry) => entry.entries.id)).toEqual([
      "e0",
      "e1",
    ])
  })
})

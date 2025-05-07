import { sleep } from "@follow/utils/utils"
import { beforeAll, beforeEach, describe, expect, test } from "vitest"

import { browserDB } from "~/database"
import { entryActions } from "~/store/entry/store"

import mockEntiresData from "./__mock__data__/entries.json"
import { EntryService } from "./entry"
import { EntryRelatedKey, EntryRelatedService } from "./entry-related"

const deleteIds = ["46871301655897088", "46871301655897090"]

describe.concurrent("Entry Service", () => {
  beforeAll(async () => {
    await browserDB.delete()
  })
  beforeEach(async () => {
    await browserDB.open()
    entryActions.upsertMany(mockEntiresData as any[])
    await sleep(1)
  })

  test.sequential("assert data is ready", async () => {
    const data = await EntryService.findAll()
    const ids = data.map((d) => d.id)
    expect(ids).toMatchInlineSnapshot(`
      [
        "46871301655897088",
        "46871301655897089",
        "46871301655897090",
        "46877798792098816",
      ]
    `)
    const readMap = await EntryRelatedService.findAll(EntryRelatedKey.READ)
    expect(readMap).toMatchInlineSnapshot(`
      {
        "46871301655897088": true,
        "46871301655897089": true,
        "46871301655897090": true,
        "46877798792098816": true,
      }
    `)
  })
  test.sequential("delete entry", async () => {
    await EntryService.deleteEntries(deleteIds)
    const readMap = await EntryRelatedService.findAll(EntryRelatedKey.READ)
    expect(readMap).toMatchInlineSnapshot(`
      {
        "46871301655897089": true,
        "46877798792098816": true,
      }
    `)
    const ret = await EntryService.findAll()
    expect(ret.map((d) => d.id)).not.toContain(deleteIds)
  })

  test.sequential("delete by feed id ", async () => {
    await EntryService.deleteEntriesByFeedIds(["41397633064960000"])
    const ret = await EntryService.findAll()
    expect(ret.map((d) => d.id)).toMatchInlineSnapshot(`
      [
        "46877798792098816",
      ]
    `)
    const readMap = await EntryRelatedService.findAll(EntryRelatedKey.READ)
    expect(readMap).toMatchInlineSnapshot(`
      {
        "46877798792098816": true,
      }
    `)
  })
})

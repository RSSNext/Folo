import { describe, expect, it } from "vitest"

import { getVisibleLocalEntryIds } from "./filter-local-entry-ids"

describe("getVisibleLocalEntryIds", () => {
  it("keeps previously visible unread entries when they turn read locally", () => {
    expect(
      getVisibleLocalEntryIds({
        sourceIds: ["entry-1", "entry-2"],
        entries: {
          "entry-1": { id: "entry-1", read: true },
          "entry-2": { id: "entry-2", read: false },
        },
        stickyVisibleIds: new Set(["entry-1", "entry-2"]),
        unreadOnly: true,
      }),
    ).toEqual(["entry-1", "entry-2"])
  })

  it("filters read entries that were not previously visible", () => {
    expect(
      getVisibleLocalEntryIds({
        sourceIds: ["entry-1", "entry-2"],
        entries: {
          "entry-1": { id: "entry-1", read: true },
          "entry-2": { id: "entry-2", read: false },
        },
        stickyVisibleIds: new Set<string>(),
        unreadOnly: true,
      }),
    ).toEqual(["entry-2"])
  })

  it("removes sticky entries once they leave the source list", () => {
    expect(
      getVisibleLocalEntryIds({
        sourceIds: ["entry-2"],
        entries: {
          "entry-1": { id: "entry-1", read: true },
          "entry-2": { id: "entry-2", read: false },
        },
        stickyVisibleIds: new Set(["entry-1", "entry-2"]),
        unreadOnly: true,
      }),
    ).toEqual(["entry-2"])
  })
})

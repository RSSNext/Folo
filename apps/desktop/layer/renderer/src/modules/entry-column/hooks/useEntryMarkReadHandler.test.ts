import { unreadSyncService } from "@follow/store/unread/store"
import { describe, expect, it, vi } from "vitest"

import { batchMarkRead } from "./useEntryMarkReadHandler"

vi.mock("@follow/store/unread/store", () => ({
  unreadSyncService: {
    queueEntriesAsRead: vi.fn(),
  },
}))

describe("batchMarkRead", () => {
  it("queues ids without requiring entries to exist in the local store", () => {
    batchMarkRead(["entry-1", "entry-2"])

    expect(unreadSyncService.queueEntriesAsRead).toHaveBeenCalledWith(["entry-1", "entry-2"])
  })
})

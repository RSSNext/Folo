import { dehydrate, MutationObserver, onlineManager } from "@tanstack/react-query"
import { afterEach, describe, expect, it, vi } from "vitest"

import { persistConfig, queryClient } from "./query-client"

describe("queryClient while the browser is offline", () => {
  afterEach(() => {
    onlineManager.setOnline(true)
    queryClient.getMutationCache().clear()
  })

  it("runs mutations at once, so their intent reaches the transaction queue", async () => {
    onlineManager.setOnline(false)
    const mutationFn = vi.fn(async (entryId: string) => entryId)

    const result = await new MutationObserver(queryClient, { mutationFn }).mutate("entry-1")

    expect(mutationFn).toHaveBeenCalledTimes(1)
    expect(result).toBe("entry-1")
  })

  it("does not persist mutations, which a reload could never run", async () => {
    onlineManager.setOnline(false)
    // A mutation that opts back into pausing, as one from an older version restored on launch.
    void new MutationObserver(queryClient, {
      mutationKey: ["paused"],
      mutationFn: async () => {},
      networkMode: "online",
    })
      .mutate()
      .catch(() => {})
    await vi.waitFor(() =>
      expect(queryClient.getMutationCache().getAll()[0]?.state.isPaused).toBe(true),
    )

    const persisted = dehydrate(queryClient, persistConfig.dehydrateOptions)

    expect(persisted.mutations).toEqual([])
  })
})

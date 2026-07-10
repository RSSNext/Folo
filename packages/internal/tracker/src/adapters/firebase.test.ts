import { describe, expect, it, vi } from "vitest"

import { TrackerMapper } from "../enums"
import { FirebaseAdapter } from "./firebase"

const createAdapter = () => {
  const logEvent = vi.fn()
  const adapter = new FirebaseAdapter({
    instance: {
      logEvent,
      setUserId: vi.fn(),
      setUserProperties: vi.fn(),
    } as never,
  })

  return { adapter, logEvent }
}

describe("FirebaseAdapter", () => {
  it("routes default mapped events by the internal event name without forwarding internal properties", async () => {
    const { adapter, logEvent } = createAdapter()
    const properties = {
      __code: TrackerMapper.AppInit,
      __eventName: "app_init",
      source: "launch",
    }
    const originalProperties = { ...properties }

    await adapter.track({ eventName: "ignored_event_name", properties })

    expect(logEvent).toHaveBeenCalledWith("app_init", { source: "launch" })
    expect(properties).toEqual(originalProperties)
  })

  it("removes internal properties from ordinary events without mutating the input", async () => {
    const { adapter, logEvent } = createAdapter()
    const properties = {
      __code: undefined,
      __eventName: "internal_event_name",
      source: "manual",
    }
    const originalProperties = { ...properties }

    await adapter.track({ eventName: "manual_event", properties })

    expect(logEvent).toHaveBeenCalledWith("manual_event", { source: "manual" })
    expect(properties).toEqual(originalProperties)
  })
})

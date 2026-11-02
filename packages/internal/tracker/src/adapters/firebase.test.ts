import { describe, expect, it, vi } from "vitest"

import { TrackerMapper } from "../enums"
import { FirebaseAdapter } from "./firebase"

const createAdapter = () => {
  const logEvent = vi.fn()
  const setUserId = vi.fn()
  const setUserProperties = vi.fn()
  const adapter = new FirebaseAdapter({
    instance: {
      logEvent,
      setUserId,
      setUserProperties,
    } as never,
  })

  return { adapter, logEvent, setUserId, setUserProperties }
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

describe("FirebaseAdapter user properties", () => {
  it("identifies the user by id only", async () => {
    const { adapter, setUserId, setUserProperties } = createAdapter()

    await adapter.identify({
      id: "user-1",
      email: "me@example.com",
      name: "Me",
      image: "https://example.com/me.png",
      handle: "me",
    })

    expect(setUserId).toHaveBeenCalledWith("user-1")
    expect(setUserProperties).not.toHaveBeenCalled()
  })

  it("clears who the user is from the properties it sets", async () => {
    const { adapter, setUserProperties } = createAdapter()

    await adapter.setUserProperties({
      build: "web",
      version: "1.16.0",
      email: "me@example.com",
      name: "Me",
      image: "https://example.com/me.png",
      handle: "me",
    })

    expect(setUserProperties).toHaveBeenCalledWith({
      build: "web",
      version: "1.16.0",
      email: null,
      name: null,
      image: null,
      handle: null,
    })
  })
})

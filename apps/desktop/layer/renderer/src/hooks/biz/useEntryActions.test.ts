import { afterEach, describe, expect, it, vi } from "vitest"

import { getReadabilityStatus, ReadabilityStatus, setReadabilityStatus } from "~/atoms/readability"

import { toggleEntryReadability } from "./useEntryActions"

const { fetchEntryReadabilityContentMock } = vi.hoisted(() => ({
  fetchEntryReadabilityContentMock: vi.fn(() => Promise.resolve()),
}))

vi.mock("@follow/store/entry/store", () => ({
  entrySyncServices: {
    fetchEntryReadabilityContent: fetchEntryReadabilityContentMock,
  },
}))

// The auth client needs the API URL of a real build
vi.mock("~/lib/auth", () => ({}))

describe("toggleEntryReadability", () => {
  afterEach(() => {
    setReadabilityStatus({ "entry-1": ReadabilityStatus.INITIAL })
    vi.clearAllMocks()
  })

  it("fetches the readable content of the entry page", async () => {
    await toggleEntryReadability({ id: "entry-1", url: "https://example.com/post" })

    expect(fetchEntryReadabilityContentMock).toHaveBeenCalledWith("entry-1", expect.any(Function))
    expect(getReadabilityStatus()["entry-1"]).toBe(ReadabilityStatus.SUCCESS)
  })

  it("leaves the onboarding entries alone", async () => {
    await toggleEntryReadability({ id: "onboarding-entry", url: "folo://onboarding/entry/1" })

    expect(fetchEntryReadabilityContentMock).not.toHaveBeenCalled()
    expect(getReadabilityStatus()["onboarding-entry"]).toBeUndefined()
  })
})

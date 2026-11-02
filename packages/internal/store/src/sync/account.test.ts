import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  clearAccountInSession,
  getLocalDataOwner,
  getSessionUserId,
  invalidateSessionUser,
  loadLocalDataOwner,
  onLocalDataOfAnotherAccount,
  onSessionUserConfirmed,
  registerSessionVerifier,
  startSessionCheck,
  verifySessionUser,
} from "./account"

const { syncMeta } = vi.hoisted(() => ({ syncMeta: new Map<string, string>() }))

vi.mock("@follow/database/services/sync-meta", () => ({
  SyncMetaService: {
    get: vi.fn(async (key: string) => syncMeta.get(key) ?? null),
    set: vi.fn(async (key: string, value: string) => {
      syncMeta.set(key, value)
    }),
  },
}))

describe("account binding", () => {
  beforeEach(() => {
    syncMeta.clear()
    clearAccountInSession()
    registerSessionVerifier(async () => {})
  })

  it("keeps the recorded owner, and lets an older database belong to its last account", async () => {
    syncMeta.set("localDataOwner", "user-a")
    await loadLocalDataOwner("user-b")
    expect(getLocalDataOwner()).toBe("user-a")

    clearAccountInSession()
    syncMeta.clear()
    await loadLocalDataOwner("user-b")
    expect(getLocalDataOwner()).toBe("user-b")
    expect(syncMeta.get("localDataOwner")).toBe("user-b")

    clearAccountInSession()
    syncMeta.clear()
    await loadLocalDataOwner(null)
    expect(getLocalDataOwner()).toBeNull()
  })

  it("gives local data nobody owns to the first confirmed account", async () => {
    await loadLocalDataOwner(null)
    expect(getSessionUserId()).toBeUndefined()

    startSessionCheck().confirm("user-a")

    expect(getSessionUserId()).toBe("user-a")
    expect(getLocalDataOwner()).toBe("user-a")
    await vi.waitFor(() => expect(syncMeta.get("localDataOwner")).toBe("user-a"))
  })

  it("reports a session of another account than the owner of the local data", async () => {
    const anotherAccount = vi.fn()
    const confirmed = vi.fn()
    const stopAnother = onLocalDataOfAnotherAccount(anotherAccount)
    const stopConfirmed = onSessionUserConfirmed(confirmed)
    await loadLocalDataOwner(null)

    startSessionCheck().confirm("user-a")
    startSessionCheck().confirm(null)
    expect(anotherAccount).not.toHaveBeenCalled()

    startSessionCheck().confirm("user-b")
    expect(anotherAccount).toHaveBeenCalledWith({
      ownerUserId: "user-a",
      sessionUserId: "user-b",
    })
    // The owner does not change: the data on this device is still user-a's.
    expect(getLocalDataOwner()).toBe("user-a")
    expect(confirmed.mock.calls).toEqual([["user-a"], [null], ["user-b"]])

    stopAnother()
    stopConfirmed()
  })

  it("lets the recorded owner decide over a session that answered before it was read", async () => {
    syncMeta.set("localDataOwner", "user-a")
    const anotherAccount = vi.fn()
    const stopAnother = onLocalDataOfAnotherAccount(anotherAccount)

    // A launch with another account's session can get the session's answer first.
    startSessionCheck().confirm("user-b")
    expect(anotherAccount).not.toHaveBeenCalled()
    expect(syncMeta.get("localDataOwner")).toBe("user-a")

    await loadLocalDataOwner("user-a")

    expect(getLocalDataOwner()).toBe("user-a")
    expect(anotherAccount).toHaveBeenCalledWith({ ownerUserId: "user-a", sessionUserId: "user-b" })
    expect(syncMeta.get("localDataOwner")).toBe("user-a")
    stopAnother()
  })

  it("keeps a session that answered first as the owner when none was recorded", async () => {
    const anotherAccount = vi.fn()
    const stopAnother = onLocalDataOfAnotherAccount(anotherAccount)

    startSessionCheck().confirm("user-a")
    expect(getLocalDataOwner()).toBe("user-a")
    await loadLocalDataOwner(undefined)

    expect(getLocalDataOwner()).toBe("user-a")
    expect(syncMeta.get("localDataOwner")).toBe("user-a")
    expect(anotherAccount).not.toHaveBeenCalled()

    // The same account answering first is the usual launch: nothing to report either.
    clearAccountInSession()
    startSessionCheck().confirm("user-a")
    await loadLocalDataOwner("user-a")
    expect(anotherAccount).not.toHaveBeenCalled()
    stopAnother()
  })

  it("ignores an answer for credentials that changed while it was on its way", () => {
    startSessionCheck().confirm("user-a")
    const check = startSessionCheck()

    invalidateSessionUser()
    check.confirm("user-a")

    expect(getSessionUserId()).toBeUndefined()
  })

  it("shares a check that is under way instead of asking again", async () => {
    const verify = vi.fn(async () => {
      startSessionCheck().confirm("user-c")
    })
    registerSessionVerifier(verify)
    const check = startSessionCheck()

    const pending = verifySessionUser()
    check.confirm("user-a")

    await expect(pending).resolves.toBe("user-a")
    expect(verify).not.toHaveBeenCalled()

    invalidateSessionUser()
    await expect(verifySessionUser()).resolves.toBe("user-c")
    expect(verify).toHaveBeenCalledTimes(1)
  })

  it("stays unknown when the session endpoint cannot be reached", async () => {
    registerSessionVerifier(() => {
      throw new Error("fetch failed: offline")
    })

    await expect(verifySessionUser()).resolves.toBeUndefined()

    const check = startSessionCheck()
    check.end()
    expect(getSessionUserId()).toBeUndefined()
  })
})

import { beforeEach, describe, expect, it, vi } from "vitest"

import { createUnauthorizedSessionCheck } from "./session-check"

describe("createUnauthorizedSessionCheck", () => {
  let signedIn: boolean
  let revision: number
  let time: number
  const fetchSession = vi.fn<() => Promise<unknown>>()
  const onSessionGone = vi.fn()

  const create = () =>
    createUnauthorizedSessionCheck({
      isSignedIn: () => signedIn,
      fetchSession,
      getAuthRevision: () => revision,
      onSessionGone,
      now: () => time,
    })

  beforeEach(() => {
    signedIn = true
    revision = 1
    time = 0
    fetchSession.mockReset()
    onSessionGone.mockReset()
  })

  it("signs out locally when the session endpoint says the session is gone", async () => {
    fetchSession.mockResolvedValue(null)

    await create()()

    expect(fetchSession).toHaveBeenCalledTimes(1)
    expect(onSessionGone).toHaveBeenCalledTimes(1)
  })

  it("keeps the user signed in when only that endpoint refused the session", async () => {
    fetchSession.mockResolvedValue({ user: { id: "user-1" } })

    await create()()

    expect(onSessionGone).not.toHaveBeenCalled()
  })

  it("keeps the user signed in when the session endpoint cannot be reached", async () => {
    fetchSession.mockRejectedValue(new Error("fetch failed: offline"))

    await create()()

    expect(onSessionGone).not.toHaveBeenCalled()
  })

  it("asks once for a burst of refused requests, and again only after a while", async () => {
    fetchSession.mockResolvedValue({ user: { id: "user-1" } })
    const check = create()

    await Promise.all([check(), check(), check()])
    expect(fetchSession).toHaveBeenCalledTimes(1)

    time = 10_000
    await check()
    expect(fetchSession).toHaveBeenCalledTimes(1)

    time = 30_000
    await check()
    expect(fetchSession).toHaveBeenCalledTimes(2)
  })

  it("does not ask after the user was signed out locally", async () => {
    signedIn = false

    await create()()

    expect(fetchSession).not.toHaveBeenCalled()
  })

  it("ignores the answer when a sign-in replaced the session meanwhile", async () => {
    fetchSession.mockImplementation(async () => {
      revision += 1
      return null
    })

    await create()()

    expect(onSessionGone).not.toHaveBeenCalled()
  })
})

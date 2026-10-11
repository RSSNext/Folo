import type { AuthClient } from "@follow/shared/auth"
import { FollowAPIError, FollowAuthError, FollowTimeoutError } from "@follow-app/client-sdk"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { apiContext, authClientContext } from "../../context"
import type { FollowAPI } from "../../types"
import type { MeModel } from "./store"
import { userSyncService, useUserStore } from "./store"

vi.mock("@follow/database/services/user", () => ({
  UserService: {
    getUserAll: vi.fn(async () => []),
    reset: vi.fn(async () => {}),
    upsertMany: vi.fn(async () => {}),
    removeCurrentUser: vi.fn(async () => {}),
  },
}))

const me = { id: "user1", name: "Me", email: "me@example.com" } as MeModel

describe("userSyncService.whoami", () => {
  const getSessionMock = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    useUserStore.setState({ users: {}, whoami: me, role: null, roleEndAt: null })
    apiContext.provide({ auth: { getSession: getSessionMock } } as unknown as FollowAPI)
  })

  it.each([
    ["browser fetch", new TypeError("Failed to fetch")],
    ["Electron IPC fetch", new Error("Error invoking remote method: TypeError: fetch failed")],
    ["React Native fetch", new TypeError("Network request failed")],
    ["timeout", new FollowTimeoutError()],
    ["server error", new FollowAPIError("Internal error", 500)],
    ["rate limit", new FollowAPIError("Too many requests", 429)],
  ])("keeps the local user when the request fails without a 401 (%s)", async (_, error) => {
    getSessionMock.mockRejectedValue(error)

    await expect(userSyncService.whoami()).rejects.toBe(error)
    expect(useUserStore.getState().whoami).toEqual(me)
  })

  it.each([
    ["FollowAuthError", new FollowAuthError()],
    ["FollowAPIError", new FollowAPIError("Unauthorized", 401)],
  ])("clears the local user on a 401 (%s)", async (_, error) => {
    getSessionMock.mockRejectedValue(error)

    await expect(userSyncService.whoami()).resolves.toBeNull()
    expect(useUserStore.getState().whoami).toBeNull()
  })

  it("clears the local user when the server returns no session", async () => {
    getSessionMock.mockResolvedValue(null)

    await expect(userSyncService.whoami()).resolves.toBeNull()
    expect(useUserStore.getState().whoami).toBeNull()
  })
})

describe("userSyncService.updateProfile", () => {
  const updateUserMock = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    useUserStore.setState({ users: {}, whoami: me, role: null, roleEndAt: null })
    authClientContext.provide({ updateUser: updateUserMock } as unknown as AuthClient)
  })

  it("rolls the change back when the auth server rejects it", async () => {
    updateUserMock.mockResolvedValue({
      data: null,
      error: { message: "Handle is already taken", status: 400, statusText: "Bad Request" },
    })

    await expect(userSyncService.updateProfile({ handle: "taken" })).rejects.toThrow(
      "Handle is already taken",
    )
    expect(useUserStore.getState().whoami).toEqual(me)
  })

  it("keeps the change when the auth server accepts it", async () => {
    updateUserMock.mockResolvedValue({ data: { status: true }, error: null })

    await userSyncService.updateProfile({ handle: "mine" })
    expect(useUserStore.getState().whoami).toEqual({ ...me, handle: "mine" })
  })
})

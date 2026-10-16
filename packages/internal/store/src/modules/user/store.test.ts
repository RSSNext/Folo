import { UserService } from "@follow/database/services/user"
import type { AuthClient } from "@follow/shared/auth"
import { FollowAPIError, FollowAuthError, FollowTimeoutError } from "@follow-app/client-sdk"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { apiContext, authClientContext } from "../../context"
import type { FollowAPI } from "../../types"
import type { MeModel } from "./store"
import { userSyncService, UserUpdateError, useUserStore } from "./store"

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

  it("keeps the code of the check that refused the change", async () => {
    updateUserMock.mockResolvedValue({
      data: null,
      error: {
        code: "HANDLE_ALREADY_TAKEN",
        message: "This handle is already taken.",
        status: 400,
        statusText: "Bad Request",
      },
    })

    const error = await userSyncService.updateProfile({ handle: "taken" }).catch((e) => e)

    expect(error).toBeInstanceOf(UserUpdateError)
    expect(error).toMatchObject({ code: "HANDLE_ALREADY_TAKEN", status: 400 })
  })

  it("keeps the change when the auth server accepts it", async () => {
    updateUserMock.mockResolvedValue({ data: { status: true }, error: null })

    await userSyncService.updateProfile({ handle: "mine" })
    expect(useUserStore.getState().whoami).toEqual({ ...me, handle: "mine" })
  })

  describe("with social links saved", () => {
    const socialLinks = { github: "folo", twitter: "folo_is" }
    const meWithLinks = { ...me, handle: "me", socialLinks } as MeModel

    beforeEach(() => {
      useUserStore.setState({ whoami: meWithLinks })
      updateUserMock.mockResolvedValue({ data: { status: true }, error: null })
    })

    it("leaves them out of an avatar change, which would clear them", async () => {
      await userSyncService.updateProfile({ image: "https://example.com/avatar.jpg" })

      expect(updateUserMock).toHaveBeenCalledWith({ image: "https://example.com/avatar.jpg" })
      expect(useUserStore.getState().whoami?.socialLinks).toEqual(socialLinks)
      await vi.waitFor(() =>
        expect(UserService.upsertMany).toHaveBeenCalledWith([
          expect.objectContaining({ image: "https://example.com/avatar.jpg", socialLinks }),
        ]),
      )
    })

    it("leaves them out of a name change, and trims the name as the server does", async () => {
      await userSyncService.updateProfile({ name: "  New Name " })

      expect(updateUserMock).toHaveBeenCalledWith({ name: "New Name" })
      expect(useUserStore.getState().whoami).toEqual({ ...meWithLinks, name: "New Name" })
    })

    it("sends the links a form edits, and empty links clear them", async () => {
      await userSyncService.updateProfile({ socialLinks: { github: "", twitter: "folo_is" } })
      expect(updateUserMock).toHaveBeenLastCalledWith({
        socialLinks: { github: "", twitter: "folo_is" },
      })

      await userSyncService.updateProfile({ socialLinks: null })
      expect(updateUserMock).toHaveBeenLastCalledWith({ socialLinks: null })
      expect(useUserStore.getState().whoami?.socialLinks).toBeNull()
    })
  })

  it("trims a new handle as the server does", async () => {
    updateUserMock.mockResolvedValue({ data: { status: true }, error: null })

    await userSyncService.updateProfile({ handle: " mine " })

    expect(updateUserMock).toHaveBeenCalledWith({ handle: "mine" })
    expect(useUserStore.getState().whoami?.handle).toBe("mine")
  })

  it.each([
    ["cleared", ""],
    ["left with only spaces", "   "],
  ])("saves a handle %s as no handle, as the server does", async (_kind, handle) => {
    useUserStore.setState({ whoami: { ...me, handle: "mine" } as MeModel })
    updateUserMock.mockResolvedValue({ data: { status: true }, error: null })

    await userSyncService.updateProfile({ handle })

    expect(updateUserMock).toHaveBeenCalledWith({ handle: null })
    expect(useUserStore.getState().whoami?.handle).toBeNull()
  })

  it("sends back a handle stored with spaces around it as it is stored", async () => {
    useUserStore.setState({ whoami: { ...me, handle: "folo " } as MeModel })
    updateUserMock.mockResolvedValue({ data: { status: true }, error: null })

    await userSyncService.updateProfile({ handle: "folo", name: "Folo" })

    expect(updateUserMock).toHaveBeenCalledWith({ handle: "folo ", name: "Folo" })
    expect(useUserStore.getState().whoami?.handle).toBe("folo ")
  })
})

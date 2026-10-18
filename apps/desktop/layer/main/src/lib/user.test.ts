import type { Credentials } from "@eneris/push-receiver/dist/types"
import { FollowAPIError, FollowAuthError } from "@follow-app/client-sdk"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { logger } from "~/logger"

import { apiClient } from "./api-client"
import { store } from "./store"
import {
  deleteNotificationsToken,
  ensureNotificationsTokenSent,
  updateNotificationsToken,
} from "./user"

const { createTokenMock, getSessionTokenMock, storeData } = vi.hoisted(() => ({
  createTokenMock: vi.fn(),
  getSessionTokenMock: vi.fn(),
  storeData: new Map<string, unknown>(),
}))

vi.mock("./api-client", () => ({
  apiClient: {
    messaging: {
      createToken: createTokenMock,
      deleteToken: vi.fn(),
    },
  },
}))

vi.mock("./cli-session-sync", () => ({
  getSessionTokenFromCookies: getSessionTokenMock,
}))

vi.mock("./store", () => ({
  store: {
    delete: vi.fn((key: string) => storeData.delete(key)),
    get: vi.fn((key: string) => storeData.get(key)),
    set: vi.fn((key: string, value: unknown) => storeData.set(key, value)),
  },
}))

vi.mock("~/env", () => ({
  isLinux: false,
  isMacOS: true,
  isWindows: false,
}))

vi.mock("~/logger", () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
  },
}))

const credentials = {
  fcm: {
    installation: {
      createdAt: 0,
      expiresIn: 0,
      fid: "fid",
      refreshToken: "refresh-token-secret",
      token: "installation-token-secret",
    },
    token: "fcm-token-secret",
  },
  gcm: {
    androidId: "android-id",
    appId: "app-id",
    securityToken: "security-token-secret",
    token: "gcm-token-secret",
  },
  keys: {
    authSecret: "auth-secret",
    privateKey: "private-key-secret",
    publicKey: "public-key",
  },
  config: {
    bundleId: "is.follow",
    projectId: "project-id",
    vapidKey: "vapid-key",
  },
} satisfies Credentials

const serializedLogs = () =>
  JSON.stringify([...vi.mocked(logger.info).mock.calls, ...vi.mocked(logger.error).mock.calls])

describe("updateNotificationsToken", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    storeData.clear()
    createTokenMock.mockResolvedValue(undefined)
  })

  afterEach(async () => {
    // Cancels retries left over by a test
    await deleteNotificationsToken()
    vi.useRealTimers()
  })

  it("registers the token without writing it to logs", async () => {
    await updateNotificationsToken(credentials)

    expect(store.set).toHaveBeenCalledWith("notifications-credentials", credentials)
    expect(apiClient.messaging.createToken).toHaveBeenCalledWith({
      channel: "macos",
      token: credentials.fcm.token,
    })
    expect(serializedLogs()).not.toContain(credentials.fcm.token)
  })

  it("logs only a safe summary when registration fails", async () => {
    createTokenMock.mockRejectedValueOnce({
      message: "request failed",
      request: {
        body: {
          token: credentials.fcm.token,
        },
      },
    })

    await updateNotificationsToken(credentials)

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining("Failed to update notification token"),
    )
    expect(serializedLogs()).not.toContain(credentials.fcm.token)
  })

  it("retries an upload that failed while the API was unreachable", async () => {
    vi.useFakeTimers()
    createTokenMock
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockRejectedValueOnce(new FollowAPIError("Bad gateway", 502))
      .mockResolvedValueOnce(undefined)

    await updateNotificationsToken(credentials)
    expect(createTokenMock).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(10_000)
    expect(createTokenMock).toHaveBeenCalledTimes(2)

    await vi.advanceTimersByTimeAsync(60_000)
    expect(createTokenMock).toHaveBeenCalledTimes(3)
    expect(storeData.get("notifications-token-sent")).toBe(credentials.fcm.token)

    await vi.advanceTimersByTimeAsync(60 * 60_000)
    expect(createTokenMock).toHaveBeenCalledTimes(3)
  })

  it("gives up after a few retries", async () => {
    vi.useFakeTimers()
    createTokenMock.mockRejectedValue(new TypeError("fetch failed"))

    await updateNotificationsToken(credentials)
    await vi.advanceTimersByTimeAsync(2 * 60 * 60_000)

    expect(createTokenMock).toHaveBeenCalledTimes(5)
    expect(storeData.has("notifications-token-sent")).toBe(false)
  })

  it.each([
    ["while signed out", new FollowAuthError()],
    ["when the server rejects the token", new FollowAPIError("Invalid token", 400)],
  ])("doesn't retry %s", async (_case, error) => {
    vi.useFakeTimers()
    createTokenMock.mockRejectedValue(error)

    // Each case waits on its own: a later call would cancel the retry the first one scheduled
    await updateNotificationsToken(credentials)
    await vi.advanceTimersByTimeAsync(60 * 60_000)

    expect(createTokenMock).toHaveBeenCalledTimes(1)
    expect(storeData.has("notifications-token-sent")).toBe(false)
  })

  it("stops retrying once the account signs out", async () => {
    vi.useFakeTimers()
    createTokenMock.mockRejectedValue(new TypeError("fetch failed"))

    await updateNotificationsToken(credentials)
    await deleteNotificationsToken()
    await vi.advanceTimersByTimeAsync(60 * 60_000)

    expect(createTokenMock).toHaveBeenCalledTimes(1)
  })
})

describe("ensureNotificationsTokenSent", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    storeData.clear()
    createTokenMock.mockResolvedValue(undefined)
    getSessionTokenMock.mockResolvedValue("session-token")
  })

  it("sends a stored token the server didn't get", async () => {
    storeData.set("notifications-credentials", credentials)

    await ensureNotificationsTokenSent()

    expect(createTokenMock).toHaveBeenCalledWith({
      channel: "macos",
      token: credentials.fcm.token,
    })
  })

  it("doesn't send the token again once the server has it", async () => {
    storeData.set("notifications-credentials", credentials)
    await updateNotificationsToken()
    createTokenMock.mockClear()

    await ensureNotificationsTokenSent()

    expect(createTokenMock).not.toHaveBeenCalled()
  })

  it("does nothing before the push service handed out a token", async () => {
    await ensureNotificationsTokenSent()

    expect(createTokenMock).not.toHaveBeenCalled()
  })

  it("waits for a sign-in instead of asking at every push connection while signed out", async () => {
    storeData.set("notifications-credentials", credentials)
    getSessionTokenMock.mockResolvedValue(undefined)

    await ensureNotificationsTokenSent()
    await ensureNotificationsTokenSent()

    expect(createTokenMock).not.toHaveBeenCalled()
  })
})

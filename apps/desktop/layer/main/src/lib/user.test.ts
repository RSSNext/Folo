import type { Credentials } from "@eneris/push-receiver/dist/types"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { logger } from "~/logger"

import { apiClient } from "./api-client"
import { store } from "./store"
import { updateNotificationsToken } from "./user"

const { createTokenMock } = vi.hoisted(() => ({
  createTokenMock: vi.fn(),
}))

vi.mock("./api-client", () => ({
  apiClient: {
    messaging: {
      createToken: createTokenMock,
      deleteToken: vi.fn(),
    },
  },
}))

vi.mock("./store", () => ({
  store: {
    get: vi.fn(),
    set: vi.fn(),
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

describe("updateNotificationsToken", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    createTokenMock.mockResolvedValue(undefined)
  })

  it("registers the token without writing it to logs", async () => {
    await updateNotificationsToken(credentials)

    expect(store.set).toHaveBeenCalledWith("notifications-credentials", credentials)
    expect(apiClient.messaging.createToken).toHaveBeenCalledWith({
      channel: "macos",
      token: credentials.fcm.token,
    })

    const serializedLogs = JSON.stringify([
      ...vi.mocked(logger.info).mock.calls,
      ...vi.mocked(logger.error).mock.calls,
    ])
    expect(serializedLogs).not.toContain(credentials.fcm.token)
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

    expect(logger.error).toHaveBeenCalledWith("Failed to update notification token")
    expect(JSON.stringify(vi.mocked(logger.error).mock.calls)).not.toContain(credentials.fcm.token)
  })
})

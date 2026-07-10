import type { Credentials } from "@eneris/push-receiver/dist/types"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { logger } from "~/logger"

import { updateNotificationsToken } from "../lib/user"
import { AppManager } from "./app"

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

const mocks = vi.hoisted(() => ({
  connect: vi.fn(),
  firebaseConfig: {
    apiKey: "firebase-api-key-secret",
    appId: "app-id",
    messagingSenderId: "sender-id",
    projectId: "project-id",
  },
  onCredentialsChanged: undefined as ((event: { newCredentials: Credentials }) => void) | undefined,
  onNotification: undefined as
    ((event: { message: { data?: Record<string, unknown> } }) => void) | undefined,
  onReady: undefined as (() => void) | undefined,
  receiverConfig: undefined as Record<string, unknown> | undefined,
  storeGet: vi.fn(),
  storeSet: vi.fn(),
  updateNotificationsToken: vi.fn(),
}))

vi.mock("@eneris/push-receiver", () => ({
  PushReceiver: class {
    persistentIds = ["persistent-id"]

    constructor(config: Record<string, unknown>) {
      mocks.receiverConfig = config
    }

    connect = mocks.connect

    onCredentialsChanged(callback: (event: { newCredentials: Credentials }) => void) {
      mocks.onCredentialsChanged = callback
    }

    onNotification(callback: (event: { message: { data?: Record<string, unknown> } }) => void) {
      mocks.onNotification = callback
    }

    onReady(callback: () => void) {
      mocks.onReady = callback
    }
  },
}))

vi.mock("@follow/shared/bridge", () => ({
  callWindowExpose: vi.fn(),
}))

vi.mock("@follow/shared/constants", () => ({
  APP_PROTOCOL: "folo",
  DEV: false,
  LEGACY_APP_PROTOCOL: "follow",
}))

vi.mock("@follow/shared/env.desktop", () => ({
  env: {
    VITE_FIREBASE_CONFIG: JSON.stringify(mocks.firebaseConfig),
  },
}))

vi.mock("electron", () => ({
  app: {},
  nativeTheme: {},
  Notification: class {},
  shell: {},
}))

vi.mock("electron-context-menu", () => ({
  default: vi.fn(),
}))

vi.mock("~/manager/window", () => ({
  WindowManager: {},
}))

vi.mock("../helper", () => ({ getIconPath: vi.fn() }))
vi.mock("../ipc", () => ({ initializeIpcServices: vi.fn() }))
vi.mock("../ipc/services/integration", () => ({ saveMediaToEagle: vi.fn() }))
vi.mock("../lib/cleaner", () => ({
  checkAndCleanCodeCache: vi.fn(),
  clearCacheCronJob: vi.fn(),
}))
vi.mock("../lib/cli-session-sync", () => ({
  getSessionTokenFromCookies: vi.fn(),
  syncSessionToCliConfig: vi.fn(),
}))
vi.mock("../lib/i18n", () => ({ t: vi.fn() }))
vi.mock("../lib/proxy", () => ({ updateProxy: vi.fn() }))
vi.mock("../lib/store", () => ({
  store: {
    get: mocks.storeGet,
    set: mocks.storeSet,
  },
}))
vi.mock("../lib/tray", () => ({ registerAppTray: vi.fn() }))
vi.mock("../lib/user", () => ({
  updateNotificationsToken: mocks.updateNotificationsToken,
}))
vi.mock("../logger", () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
  },
}))
vi.mock("../menu", () => ({ registerAppMenu: vi.fn() }))
vi.mock("../updater", () => ({ registerUpdater: vi.fn() }))
vi.mock("./lifecycle", () => ({
  LifecycleManager: {
    onReady: vi.fn(),
  },
}))

describe("AppManager push notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.receiverConfig = undefined
    mocks.onCredentialsChanged = undefined
    mocks.onNotification = undefined
    mocks.onReady = undefined
    mocks.connect.mockResolvedValue(undefined)
    mocks.storeGet.mockImplementation((key: string) => {
      if (key === "notifications-credentials") return credentials
      if (key === "notifications-persistent-ids") return ["stored-persistent-id"]
      return undefined
    })
  })

  it("initializes and handles events without logging push secrets or payloads", async () => {
    const registerPushNotifications = Reflect.get(
      AppManager,
      "registerPushNotifications",
    ) as () => Promise<void>

    await registerPushNotifications.call(AppManager)
    mocks.onCredentialsChanged?.({ newCredentials: credentials })
    mocks.onNotification?.({
      message: {
        data: {
          description: "private-notification-description",
          type: "private-event",
        },
      },
    })

    expect(mocks.receiverConfig?.debug).toBe(false)
    expect(updateNotificationsToken).toHaveBeenCalledWith(credentials)

    const serializedLogs = JSON.stringify([
      ...vi.mocked(logger.info).mock.calls,
      ...vi.mocked(logger.error).mock.calls,
    ])
    for (const secret of [
      credentials.fcm.token,
      credentials.fcm.installation.refreshToken,
      credentials.keys.privateKey,
      mocks.firebaseConfig.apiKey,
      "private-notification-description",
    ]) {
      expect(serializedLogs).not.toContain(secret)
    }
  })

  it("does not log connection error details or report a failed connection as connected", async () => {
    mocks.connect.mockRejectedValueOnce(
      new Error(`connection failed with ${credentials.fcm.token}`),
    )
    const registerPushNotifications = Reflect.get(
      AppManager,
      "registerPushNotifications",
    ) as () => Promise<void>

    await registerPushNotifications.call(AppManager)

    expect(logger.error).toHaveBeenCalledWith("PushReceiver connection failed")
    expect(logger.info).not.toHaveBeenCalledWith("PushReceiver connected")
    expect(JSON.stringify(vi.mocked(logger.error).mock.calls)).not.toContain(credentials.fcm.token)
  })
})

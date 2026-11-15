import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => {
  ;(globalThis as { __DEV__?: boolean }).__DEV__ = false
  const secureStore = new Map<string, string>([
    [
      "follow_auth_cookie",
      JSON.stringify({
        "better-auth.session_token": { value: "session-token", expires: null },
      }),
    ],
  ])
  class SecureStoreLockedError extends Error {}
  return {
    secureStore,
    SecureStoreLockedError,
    readError: null as Error | null,
    expoStorage: null as {
      getItem: (key: string) => string | null
      setItem: (key: string, value: string) => unknown
    } | null,
    authSignOut: vi.fn(async () => {}),
    invalidateQueries: vi.fn(async () => {}),
    resetQueries: vi.fn(async () => {}),
    reloadApp: vi.fn(async (_reason: string) => {}),
    invalidateSessionUser: vi.fn(),
  }
})

vi.mock("@better-auth/expo/client", () => ({
  expoClient: (options: { storage: NonNullable<typeof mocks.expoStorage> }) => {
    mocks.expoStorage = options.storage
    return { id: "expo" }
  },
  getSetCookie: vi.fn(),
  storageAdapter: () => ({ getItem: vi.fn(), getItemAsync: vi.fn(), setItemAsync: vi.fn() }),
}))
vi.mock("better-auth/react", () => ({
  createAuthClient: () => ({ signOut: mocks.authSignOut }),
}))
vi.mock("@follow/shared/auth", () => ({ baseAuthPlugins: [] }))
vi.mock("@follow/store/sync/account", () => ({
  invalidateSessionUser: mocks.invalidateSessionUser,
  onLocalDataOfAnotherAccount: vi.fn(),
}))
vi.mock("@follow/store/user/constants", () => ({ isNewUserQueryKey: ["is-new-user"] }))
vi.mock("@follow/store/user/hooks", () => ({ whoamiQueryKey: ["whoami"] }))
vi.mock("@follow/store/user/store", () => ({
  userActions: { removeCurrentUser: vi.fn(async () => {}) },
}))
vi.mock("@follow/utils/headers", () => ({ createMobileAPIHeaders: () => ({}) }))
vi.mock("@tanstack/react-query", () => ({ useQuery: vi.fn() }))
vi.mock("expo-application", () => ({ nativeApplicationVersion: "1.0.0" }))
vi.mock("expo-sqlite/kv-store", () => ({ default: { getItemSync: () => null } }))
vi.mock("expo-web-browser", () => ({}))
vi.mock("react-native", () => ({ Platform: { OS: "ios" } }))
vi.mock("react-native-device-info", () => ({
  default: { getInstallerPackageName: async () => "" },
}))
vi.mock("./client-session", () => ({ getClientId: () => "client", getSessionId: () => "session" }))
vi.mock("./local-data-reset", () => ({ scheduleLocalDataReset: vi.fn() }))
vi.mock("./native/user-agent", () => ({ getUserAgent: async () => "Folo" }))
vi.mock("./navigation/Navigation", () => ({
  Navigation: { rootNavigation: { popToRoot: vi.fn() } },
}))
vi.mock("./proxy-env", () => ({
  getEnvProfile: () => "local",
  proxyEnv: { API_URL: "http://localhost:3000" },
}))
vi.mock("./push-token", () => ({ unregisterPushToken: vi.fn(async () => {}) }))
vi.mock("./query-client", () => ({
  queryClient: { invalidateQueries: mocks.invalidateQueries, resetQueries: mocks.resetQueries },
}))
vi.mock("./reload-app", () => ({ reloadApp: mocks.reloadApp }))
vi.mock("./secure-store", () => ({
  SecureStoreLockedError: mocks.SecureStoreLockedError,
  safeSecureStore: {
    getItem: (key: string) => {
      if (mocks.readError) throw mocks.readError
      return mocks.secureStore.get(key) ?? null
    },
    setItem: (key: string, value: string) => void mocks.secureStore.set(key, value),
    removeItem: (key: string) => void mocks.secureStore.delete(key),
    removeItemAsync: async (key: string) => void mocks.secureStore.delete(key),
  },
}))
vi.mock("./social-auth", () => ({
  buildAuthorizationProxyURL: vi.fn(),
  parseSocialAuthCallbackURL: vi.fn(),
}))

const { cookieKey, signOut } = await import("./auth")

const storeSessionCookie = (token: string) =>
  mocks.expoStorage!.setItem(
    cookieKey,
    JSON.stringify({ "better-auth.session_token": { value: token, expires: null } }),
  )

// What the Expo plugin does as the sign-out request leaves, before the server answered
const dropStoredSession = () => mocks.expoStorage!.setItem(cookieKey, "{}")

describe("signOut", () => {
  beforeEach(async () => {
    await storeSessionCookie("session-token")
    mocks.authSignOut.mockReset().mockImplementation(async () => {
      await dropStoredSession()
    })
    mocks.invalidateQueries.mockClear()
    mocks.resetQueries.mockClear()
    mocks.reloadApp.mockReset().mockResolvedValue(undefined)
    mocks.invalidateSessionUser.mockClear()
  })

  it("reloads without loading the signed-out session's queries again", async () => {
    await signOut()

    expect(mocks.authSignOut).toHaveBeenCalledTimes(1)
    // The session is still treated as changed, so nothing queued goes out with it
    expect(mocks.invalidateSessionUser).toHaveBeenCalled()
    expect(mocks.resetQueries).not.toHaveBeenCalled()
    expect(mocks.invalidateQueries).not.toHaveBeenCalled()
    expect(mocks.reloadApp).toHaveBeenCalledWith("User sign out")
  })

  it("loads the queries again for a session that changes otherwise", async () => {
    await storeSessionCookie("another-session-token")

    expect(mocks.resetQueries).toHaveBeenCalledWith({ queryKey: ["entries"] })
    expect(mocks.invalidateQueries).toHaveBeenCalledWith({ queryKey: ["whoami"] })
  })

  it("shows the signed-out state when the app could not reload", async () => {
    const error = new Error("reload unavailable")
    mocks.reloadApp.mockRejectedValueOnce(error)

    await expect(signOut()).rejects.toBe(error)
    expect(mocks.resetQueries).toHaveBeenCalledWith({ queryKey: ["entries"] })

    // And the next sign-in loads its queries as usual
    mocks.resetQueries.mockClear()
    await storeSessionCookie("next-session-token")
    expect(mocks.resetQueries).toHaveBeenCalledWith({ queryKey: ["entries"] })
  })
})

describe("auth cookie storage", () => {
  beforeEach(async () => {
    mocks.readError = null
    await storeSessionCookie("session-token")
  })

  it("fails the read while the keychain is locked instead of reporting no session", () => {
    mocks.readError = new mocks.SecureStoreLockedError("locked")

    expect(() => mocks.expoStorage!.getItem(cookieKey)).toThrow(mocks.SecureStoreLockedError)

    mocks.readError = null
    expect(mocks.expoStorage!.getItem(cookieKey)).toContain("session-token")
  })

  it("reports no session for other read errors", () => {
    mocks.readError = new Error("Invalid key")

    expect(mocks.expoStorage!.getItem(cookieKey)).toBeNull()
  })
})

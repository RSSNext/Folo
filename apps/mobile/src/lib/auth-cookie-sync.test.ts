import { describe, expect, it, vi } from "vitest"

import {
  createSessionAwareAuthCookieStorage,
  extractSetCookieHeaderValues,
  hasAuthSessionChanged,
  mergeStoredAuthCookies,
} from "./auth-cookie-sync"

const createStoredCookie = ({
  token = "session-token",
  tokenExpires = "2026-09-01T12:00:00.000Z",
  data = "session-data",
  dataExpires = "2026-09-01T12:00:00.000Z",
  extra = {},
}: {
  token?: string | null
  tokenExpires?: string | null
  data?: string | null
  dataExpires?: string | null
  extra?: Record<string, { expires: string | null; value: string }>
} = {}) =>
  JSON.stringify({
    ...(token === null
      ? {}
      : {
          "better-auth.session_token": {
            value: token,
            expires: tokenExpires,
          },
        }),
    ...(data === null
      ? {}
      : {
          "better-auth.session_data": {
            value: data,
            expires: dataExpires,
          },
        }),
    ...extra,
  })

const chunkMarker = "\u0001ba-chunks:"
const storageValueLimit = 1800

const getChunkedCookie = (value: string) => {
  const chunks = Array.from({ length: Math.ceil(value.length / storageValueLimit) }, (_, index) => {
    const start = index * storageValueLimit
    return value.slice(start, start + storageValueLimit)
  })
  return {
    chunks,
    marker: `${chunkMarker}${chunks.length}`,
  }
}

const writeChunkedCookie = async (
  storage: ReturnType<typeof createSessionAwareAuthCookieStorage>,
  key: string,
  value: string,
) => {
  const { chunks, marker } = getChunkedCookie(value)
  await storage.setItem(key, "")
  for (const [index, chunk] of chunks.entries()) {
    await storage.setItem(`${key}.${index}`, chunk)
  }
  await storage.setItem(key, marker)
}

describe("mobile auth cookie sync", () => {
  it("observes recoverable Expo cookie slots only after their marker is committed", async () => {
    const key = "follow_auth_cookie"
    const initial = createStoredCookie({ token: "initial" })
    const next = createStoredCookie({ token: "next" })
    const values = new Map<string, string>([
      [key, `${chunkMarker}1:0`],
      [`${key}.0.0`, initial],
    ])
    const onSessionChange = vi.fn()
    const storage = createSessionAwareAuthCookieStorage({
      cookieKey: key,
      storage: {
        getItem: (name) => values.get(name) ?? null,
        setItem: (name, value) => values.set(name, value),
        removeItem: (name) => values.delete(name),
      },
      onSessionChange,
    })

    // An interrupted write recovers the previous slot and keeps the same session.
    await storage.setItemAsync(key, `${chunkMarker}2:1:1`)
    expect(onSessionChange).not.toHaveBeenCalled()
    await storage.setItemAsync(`${key}.1.0`, next.slice(0, 80))
    await storage.setItemAsync(`${key}.1.1`, next.slice(80))
    expect(onSessionChange).not.toHaveBeenCalled()
    await storage.setItemAsync(key, `${chunkMarker}2:1:1`)
    expect(onSessionChange).toHaveBeenCalledTimes(1)
    expect(await storage.getItemAsync(key)).toBe(`${chunkMarker}2:1:1`)

    // Removing obsolete chunks after a committed write must not invalidate the session.
    await storage.removeItem(`${key}.0.0`)
    expect(onSessionChange).toHaveBeenCalledTimes(1)
    await storage.removeItem(key)
    expect(onSessionChange).toHaveBeenCalledTimes(2)
  })

  it("keeps the two-factor cookie from a React Native style combined Set-Cookie header", () => {
    const previousCookie = JSON.stringify({
      "better-auth.session_token": {
        value: "old-session",
        expires: null,
      },
    })
    const combinedSetCookie = [
      "better-auth.session_token=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax",
      "better-auth.session_data=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax",
      "better-auth.two_factor=signed-two-factor; Max-Age=600; Path=/; HttpOnly; SameSite=Lax",
      "better-auth.last_used_login_method=email; Max-Age=2592000; Path=/; HttpOnly; SameSite=Lax",
    ].join(", ")

    const storedCookie = mergeStoredAuthCookies([combinedSetCookie], previousCookie)
    const parsed = JSON.parse(storedCookie)

    expect(parsed["better-auth.session_token"]).toBeUndefined()
    expect(parsed["better-auth.session_data"]).toBeUndefined()
    expect(parsed["better-auth.two_factor"]?.value).toBe("signed-two-factor")
    expect(parsed["better-auth.last_used_login_method"]?.value).toBe("email")
  })

  it("reads Set-Cookie values from standard and React Native header shapes", () => {
    const headers = new Headers({
      "set-cookie": "better-auth.two_factor=signed-two-factor; Path=/; HttpOnly",
    }) as Headers & {
      _headers?: Record<string, string[]>
    }
    headers._headers = {
      "set-cookie": ["better-auth.last_used_login_method=email; Path=/; HttpOnly"],
    }

    expect(extractSetCookieHeaderValues(headers)).toEqual([
      "better-auth.two_factor=signed-two-factor; Path=/; HttpOnly",
      "better-auth.last_used_login_method=email; Path=/; HttpOnly",
    ])
  })

  it("ignores unrelated cookies", () => {
    const storedCookie = mergeStoredAuthCookies(
      ["analytics_id=third-party; Max-Age=60; Path=/"],
      "{}",
    )

    expect(storedCookie).toBe("{}")
  })

  it("ignores expiry and ancillary cookie updates when the session values stay the same", () => {
    const previousCookie = createStoredCookie({
      extra: {
        "better-auth.two_factor": {
          value: "old-two-factor",
          expires: "2026-09-01T12:00:00.000Z",
        },
      },
    })
    const nextCookie = createStoredCookie({
      tokenExpires: "2026-09-02T12:00:00.000Z",
      dataExpires: "2026-09-02T12:00:00.000Z",
      extra: {
        "better-auth.two_factor": {
          value: "new-two-factor",
          expires: "2026-09-02T12:00:00.000Z",
        },
      },
    })

    expect(hasAuthSessionChanged(previousCookie, nextCookie)).toBe(false)
  })

  it.each([
    ["adds a session token", createStoredCookie({ token: null }), createStoredCookie()],
    ["removes a session token", createStoredCookie(), createStoredCookie({ token: null })],
    ["changes a session token", createStoredCookie(), createStoredCookie({ token: "next-token" })],
    ["changes session data", createStoredCookie(), createStoredCookie({ data: "next-data" })],
  ])("detects when the auth session %s", (_name, previousCookie, nextCookie) => {
    expect(hasAuthSessionChanged(previousCookie, nextCookie)).toBe(true)
  })

  it("treats malformed stored cookies as a session change", () => {
    expect(hasAuthSessionChanged("not-json", "not-json")).toBe(true)
    expect(hasAuthSessionChanged(createStoredCookie(), "[]")).toBe(true)
  })

  it("compares complete chunked cookies before notifying about a session change", async () => {
    const values = new Map<string, string>()
    const onSessionChange = vi.fn()
    const storage = createSessionAwareAuthCookieStorage({
      cookieKey: "follow_auth_cookie",
      storage: {
        getItem: (key) => values.get(key) ?? null,
        setItem: (key, value) => values.set(key, value),
        removeItem: (key) => values.delete(key),
      },
      onSessionChange,
    })
    const largeAncillaryCookie = {
      "better-auth.two_factor": {
        value: "x".repeat(storageValueLimit),
        expires: "2026-09-01T12:00:00.000Z",
      },
    }

    await writeChunkedCookie(
      storage,
      "follow_auth_cookie",
      createStoredCookie({ extra: largeAncillaryCookie }),
    )
    expect(onSessionChange).toHaveBeenCalledTimes(1)
    onSessionChange.mockClear()

    await writeChunkedCookie(
      storage,
      "follow_auth_cookie",
      createStoredCookie({
        tokenExpires: "2026-09-02T12:00:00.000Z",
        dataExpires: "2026-09-02T12:00:00.000Z",
        extra: largeAncillaryCookie,
      }),
    )
    expect(onSessionChange).not.toHaveBeenCalled()

    await writeChunkedCookie(
      storage,
      "follow_auth_cookie",
      createStoredCookie({ token: "next-token", extra: largeAncillaryCookie }),
    )
    expect(onSessionChange).toHaveBeenCalledTimes(1)
  })

  it("notifies only after the changed session wins an interleaved chunk write", async () => {
    const values = new Map<string, string>()
    const onSessionChange = vi.fn()
    const key = "follow_auth_cookie"
    const storage = createSessionAwareAuthCookieStorage({
      cookieKey: key,
      storage: {
        getItem: (storageKey) => values.get(storageKey) ?? null,
        setItem: (storageKey, value) => values.set(storageKey, value),
        removeItem: (storageKey) => values.delete(storageKey),
      },
      onSessionChange,
    })
    const largeAncillaryCookie = {
      "better-auth.two_factor": {
        value: "x".repeat(storageValueLimit),
        expires: "2026-09-01T12:00:00.000Z",
      },
    }
    const initialCookie = createStoredCookie({ extra: largeAncillaryCookie })
    const unchangedCookie = createStoredCookie({
      tokenExpires: "2026-09-02T12:00:00.000Z",
      dataExpires: "2026-09-02T12:00:00.000Z",
      extra: largeAncillaryCookie,
    })
    const changedCookie = createStoredCookie({
      token: "next-token",
      extra: largeAncillaryCookie,
    })
    const unchangedChunks = getChunkedCookie(unchangedCookie)
    const changedChunks = getChunkedCookie(changedCookie)

    await writeChunkedCookie(storage, key, initialCookie)
    onSessionChange.mockClear()

    // Start the changed write first, then let an unchanged write commit before it.
    await storage.setItem(key, "")
    await storage.setItem(key, "")
    for (const [index, chunk] of unchangedChunks.chunks.entries()) {
      await storage.setItem(`${key}.${index}`, chunk)
    }
    await storage.setItem(key, unchangedChunks.marker)
    expect(onSessionChange).not.toHaveBeenCalled()

    for (const [index, chunk] of changedChunks.chunks.entries()) {
      await storage.setItem(`${key}.${index}`, chunk)
    }
    await storage.setItem(key, changedChunks.marker)
    expect(onSessionChange).toHaveBeenCalledTimes(1)
  })

  it("does not replace the comparison baseline with an incomplete chunk write", async () => {
    const values = new Map<string, string>()
    const onSessionChange = vi.fn()
    const key = "follow_auth_cookie"
    const storage = createSessionAwareAuthCookieStorage({
      cookieKey: key,
      storage: {
        getItem: (storageKey) => values.get(storageKey) ?? null,
        setItem: (storageKey, value) => values.set(storageKey, value),
        removeItem: (storageKey) => values.delete(storageKey),
      },
      onSessionChange,
    })
    const initialCookie = createStoredCookie()
    const changedCookie = createStoredCookie({
      token: "next-token",
      extra: {
        "better-auth.two_factor": {
          value: "x".repeat(storageValueLimit),
          expires: "2026-09-01T12:00:00.000Z",
        },
      },
    })
    const { chunks, marker } = getChunkedCookie(changedCookie)

    await storage.setItem(key, initialCookie)
    onSessionChange.mockClear()

    await storage.setItem(key, "")
    await storage.setItem(`${key}.0`, chunks[0]!)
    await storage.setItem(key, marker)
    expect(onSessionChange).not.toHaveBeenCalled()

    for (const [index, chunk] of chunks.entries()) {
      await storage.setItem(`${key}.${index}`, chunk)
    }
    await storage.setItem(key, marker)
    expect(onSessionChange).toHaveBeenCalledTimes(1)
  })
})

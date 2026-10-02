import type { BetterAuthClientPlugin } from "better-auth/client"
import { parseSetCookieHeader } from "better-auth/cookies"

type AuthCookieStorage = {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => unknown
}

type RemovableAuthCookieStorage = AuthCookieStorage & {
  removeItem: (key: string) => unknown
}

type AsyncAuthCookieStorage = RemovableAuthCookieStorage & {
  getItemAsync: (key: string) => Promise<string | null>
  setItemAsync: (key: string, value: string) => Promise<void>
}

type StoredCookie = Record<
  string,
  {
    expires: string | null
    value: string
  }
>

const parseStoredCookieSafely = (cookie: string | null | undefined): StoredCookie | null => {
  if (!cookie) {
    return {}
  }

  try {
    const parsed: unknown = JSON.parse(cookie)
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null
    }

    for (const value of Object.values(parsed)) {
      if (
        !value ||
        typeof value !== "object" ||
        !("value" in value) ||
        typeof value.value !== "string" ||
        !("expires" in value) ||
        (value.expires !== null && typeof value.expires !== "string")
      ) {
        return null
      }
    }

    return parsed as StoredCookie
  } catch {
    return null
  }
}

const parseStoredCookie = (cookie: string | null | undefined): StoredCookie => {
  if (!cookie) {
    return {}
  }

  try {
    const parsed = JSON.parse(cookie)
    return parsed && typeof parsed === "object" ? parsed : {}
  } catch {
    return {}
  }
}

const isSessionCookieName = (name: string) =>
  name.includes("session_token") || name.includes("session_data")

// Session responses routinely extend cookie expiry without changing the signed-in user.
export const hasAuthSessionChanged = (
  previousCookie: string | null | undefined,
  nextCookie: string | null | undefined,
) => {
  const previous = parseStoredCookieSafely(previousCookie)
  const next = parseStoredCookieSafely(nextCookie)
  if (!previous || !next) {
    return true
  }

  const sessionCookieNames = new Set(
    [...Object.keys(previous), ...Object.keys(next)].filter(isSessionCookieName),
  )
  return Array.from(sessionCookieNames).some((name) => previous[name]?.value !== next[name]?.value)
}

const getCookieHeaderFromStoredCookie = (cookie: string) =>
  Object.entries(parseStoredCookie(cookie)).reduce((acc, [key, value]) => {
    if (value.expires && new Date(value.expires) < new Date()) {
      return acc
    }

    return acc ? `${acc}; ${key}=${value.value}` : `${key}=${value.value}`
  }, "")

const mergeSetCookieHeader = (header: string, previousCookie?: string | null) => {
  const parsed = parseSetCookieHeader(header)
  const nextCookie = parseStoredCookie(previousCookie)

  parsed.forEach((cookie, key) => {
    const expiresAt = cookie.expires
    const maxAge = cookie["max-age"]
    if (maxAge !== undefined && Number(maxAge) <= 0) {
      delete nextCookie[key]
      return
    }

    const expires = maxAge
      ? new Date(Date.now() + Number(maxAge) * 1000)
      : expiresAt
        ? new Date(String(expiresAt))
        : null
    if (expires && expires.getTime() <= Date.now()) {
      delete nextCookie[key]
      return
    }

    nextCookie[key] = {
      value: cookie.value,
      expires: expires ? expires.toISOString() : null,
    }
  })

  return JSON.stringify(nextCookie)
}

const normalizeCookieName = (name: string) => name.replace(/:/g, "_")

const storageValueLimit = 1800
const chunkMarker = "\u0001ba-chunks:"

const createCookieStorage = (storage: AuthCookieStorage) => ({
  getItem(name: string) {
    const key = normalizeCookieName(name)
    const stored = storage.getItem(key)
    if (!stored?.startsWith(chunkMarker)) {
      return stored
    }

    const [countValue, slot, fallbackValue, ...extra] = stored.slice(chunkMarker.length).split(":")
    const count = Number(countValue)
    const fallbackCount = fallbackValue === undefined ? null : Number(fallbackValue)
    const validCount = (value: number) => Number.isInteger(value) && value >= 1 && value <= 100
    if (
      extra.length > 0 ||
      !validCount(count) ||
      (slot !== undefined && slot !== "0" && slot !== "1") ||
      (fallbackCount !== null && !validCount(fallbackCount))
    ) {
      return null
    }

    const readChunks = (prefix: string, length: number) => {
      let value = ""
      for (let index = 0; index < length; index++) {
        const chunk = storage.getItem(`${prefix}.${index}`)
        if (!chunk) {
          return null
        }
        value += chunk
      }
      return value
    }

    const value = readChunks(slot === undefined ? key : `${key}.${slot}`, count)
    if (value === null && slot !== undefined && fallbackCount !== null) {
      return readChunks(`${key}.${slot === "0" ? "1" : "0"}`, fallbackCount)
    }
    return value
  },
  async setItem(name: string, value: string) {
    const key = normalizeCookieName(name)
    if (value.length <= storageValueLimit) {
      await storage.setItem(key, value)
      return
    }

    await storage.setItem(key, "")
    const count = Math.ceil(value.length / storageValueLimit)
    for (let index = 0; index < count; index++) {
      const start = index * storageValueLimit
      await storage.setItem(`${key}.${index}`, value.slice(start, start + storageValueLimit))
    }
    await storage.setItem(key, `${chunkMarker}${count}`)
  },
})

export const createSessionAwareAuthCookieStorage = ({
  cookieKey,
  storage,
  onSessionChange,
}: {
  cookieKey: string
  storage: RemovableAuthCookieStorage
  onSessionChange: () => void
}): AsyncAuthCookieStorage => {
  const normalizedCookieKey = normalizeCookieName(cookieKey)
  const cookieStorage = createCookieStorage(storage)
  let lastObservedCookie = cookieStorage.getItem(cookieKey)

  const sessionStorage: AsyncAuthCookieStorage = {
    getItem(key) {
      return storage.getItem(key)
    },
    async getItemAsync(key) {
      return storage.getItem(key)
    },
    async setItemAsync(key, value) {
      await sessionStorage.setItem(key, value)
    },
    async setItem(key, value) {
      if (key !== normalizedCookieKey) {
        await storage.setItem(key, value)
        return
      }

      await storage.setItem(key, value)
      if (value === "") {
        return
      }

      const nextCookie = cookieStorage.getItem(cookieKey)
      if (nextCookie === null || parseStoredCookieSafely(nextCookie) === null) {
        return
      }

      const previousCookie = lastObservedCookie
      lastObservedCookie = nextCookie
      if (hasAuthSessionChanged(previousCookie, nextCookie)) {
        onSessionChange()
      }
    },
    async removeItem(key) {
      await storage.removeItem(key)

      if (key === normalizedCookieKey) {
        const previousCookie = lastObservedCookie
        lastObservedCookie = null
        if (hasAuthSessionChanged(previousCookie, null)) {
          onSessionChange()
        }
      }
    },
  }
  return sessionStorage
}

const managedAuthCookieNames = new Set([
  "two_factor",
  "dont_remember",
  "trust_device",
  "better-auth.two_factor",
  "better-auth.dont_remember",
  "better-auth.trust_device",
  "better-auth.session_token",
  "better-auth.session_data",
  "better-auth.last_used_login_method",
  "__Secure-better-auth.two_factor",
  "__Secure-better-auth.dont_remember",
  "__Secure-better-auth.trust_device",
  "__Secure-better-auth.session_token",
  "__Secure-better-auth.session_data",
])

const getHeaderValues = (value: unknown): string[] => {
  if (!value) {
    return []
  }

  if (Array.isArray(value)) {
    return value.flatMap(getHeaderValues)
  }

  if (typeof value === "string") {
    return value ? [value] : []
  }

  return []
}

const getHeaderObjectValue = (source: unknown) => {
  if (!source || typeof source !== "object") {
    return []
  }

  const record = source as Record<string, unknown>
  return [
    ...getHeaderValues(record["set-cookie"]),
    ...getHeaderValues(record["Set-Cookie"]),
    ...getHeaderValues(record["Set-cookie"]),
  ]
}

export const extractSetCookieHeaderValues = (headers: Headers) => {
  const values = new Set<string>()
  const push = (value: unknown) => {
    for (const header of getHeaderValues(value)) {
      values.add(header)
    }
  }

  const withGetSetCookie = headers as Headers & {
    getSetCookie?: () => string[]
  }
  if (typeof withGetSetCookie.getSetCookie === "function") {
    push(withGetSetCookie.getSetCookie())
  }

  push(headers.get("set-cookie"))

  headers.forEach((value, key) => {
    if (key.toLowerCase() === "set-cookie") {
      push(value)
    }
  })

  const internals = headers as Headers & {
    _headers?: unknown
    headers?: unknown
    map?: unknown
  }

  for (const source of [internals.map, internals._headers, internals.headers]) {
    push(getHeaderObjectValue(source))
  }

  return Array.from(values)
}

const getCookieName = (setCookieHeader: string) => {
  const trimmed = setCookieHeader.trim()
  const firstPart = trimmed.split(";", 1)[0] ?? ""
  const equalsIndex = firstPart.indexOf("=")
  if (equalsIndex <= 0) {
    return null
  }

  return firstPart.slice(0, equalsIndex)
}

const isManagedAuthSetCookieHeader = (setCookieHeader: string) => {
  const cookieName = getCookieName(setCookieHeader)
  return cookieName ? managedAuthCookieNames.has(cookieName) : false
}

export const mergeStoredAuthCookies = (
  setCookieHeaders: string[],
  previousCookie: string | null | undefined,
) => {
  let nextCookie = previousCookie || "{}"

  for (const setCookieHeader of setCookieHeaders) {
    if (!isManagedAuthSetCookieHeader(setCookieHeader)) {
      continue
    }
    nextCookie = mergeSetCookieHeader(setCookieHeader, nextCookie)
  }

  return nextCookie
}

export const createMobileAuthCookieSyncPlugin = ({
  cookieKey,
  storage,
  cookieStorage = createCookieStorage(storage),
}: {
  cookieKey: string
  storage: AuthCookieStorage
  cookieStorage?: AuthCookieStorage
}): BetterAuthClientPlugin => {
  const getStoredCookieHeader = () =>
    getCookieHeaderFromStoredCookie(cookieStorage.getItem(cookieKey) || "{}")

  const syncResponseCookies = async (response: Response) => {
    const setCookieHeaders = extractSetCookieHeaderValues(response.headers)
    if (setCookieHeaders.length === 0) {
      return
    }

    const previousCookie = cookieStorage.getItem(cookieKey)
    const nextCookie = mergeStoredAuthCookies(setCookieHeaders, previousCookie)
    if (nextCookie !== (previousCookie || "{}")) {
      await cookieStorage.setItem(cookieKey, nextCookie)
    }
  }

  return {
    id: "mobile-auth-cookie-sync",
    fetchPlugins: [
      {
        id: "mobile-auth-cookie-sync",
        name: "Mobile Auth Cookie Sync",
        hooks: {
          async onResponse(context) {
            await syncResponseCookies(context.response)
          },
        },
        async init(url, options) {
          if (!url.includes("/two-factor/verify-totp")) {
            return { url, options }
          }

          const cookie = getStoredCookieHeader()
          if (!cookie) {
            return { url, options }
          }

          return {
            url,
            options: {
              ...options,
              headers: {
                ...options?.headers,
                cookie,
              },
            },
          }
        },
      },
    ],
  }
}

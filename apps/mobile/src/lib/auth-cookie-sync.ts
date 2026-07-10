import type { BetterAuthClientPlugin } from "better-auth/client"
import { parseSetCookieHeader } from "better-auth/cookies"

type AuthCookieStorage = {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => unknown
}

type StoredCookie = Record<
  string,
  {
    expires: string | null
    value: string
  }
>

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

    const count = Number(stored.slice(chunkMarker.length))
    if (!Number.isInteger(count) || count < 1) {
      return null
    }

    let value = ""
    for (let index = 0; index < count; index++) {
      const chunk = storage.getItem(`${key}.${index}`)
      if (chunk == null) {
        return null
      }
      value += chunk
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
}: {
  cookieKey: string
  storage: AuthCookieStorage
}): BetterAuthClientPlugin => {
  const cookieStorage = createCookieStorage(storage)
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

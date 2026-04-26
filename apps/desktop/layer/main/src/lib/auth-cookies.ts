import {
  BETTER_AUTH_SECURE_SESSION_TOKEN_COOKIE_NAME,
  BETTER_AUTH_SESSION_TOKEN_COOKIE_NAME,
} from "@follow/shared/auth-cookie"
import type { Cookie, CookiesSetDetails, Session } from "electron"

const MANAGED_AUTH_COOKIE_NAMES = [
  BETTER_AUTH_SECURE_SESSION_TOKEN_COOKIE_NAME,
  BETTER_AUTH_SESSION_TOKEN_COOKIE_NAME,
  "__Secure-better-auth.session_data",
  "better-auth.session_data",
  "better-auth.last_used_login_method",
  "dont_remember",
  "__Secure-better-auth.dont_remember",
  "better-auth.dont_remember",
  "trust_device",
  "__Secure-better-auth.trust_device",
  "better-auth.trust_device",
  "two_factor",
  "__Secure-better-auth.two_factor",
  "better-auth.two_factor",
] as const

type ManagedAuthCookieName = (typeof MANAGED_AUTH_COOKIE_NAMES)[number]
type ManagedAuthCookie = Pick<Cookie, "name" | "value"> &
  Partial<Pick<Cookie, "domain" | "hostOnly" | "path" | "secure">>
type KnownManagedAuthCookie = ManagedAuthCookie & { name: ManagedAuthCookieName }

type ParsedSetCookie = {
  domain?: string
  expirationDate?: number
  httpOnly: boolean
  maxAge?: number
  name: string
  path: string
  sameSite?: CookiesSetDetails["sameSite"]
  secure: boolean
  value: string
}

const MANAGED_AUTH_COOKIE_NAME_SET = new Set<string>(MANAGED_AUTH_COOKIE_NAMES)
const COOKIE_CLEANUP_SUBDOMAIN = "__folo_cookie_cleanup__"

const splitSetCookieHeader = (header: string) => {
  const parts: string[] = []
  let buffer = ""

  for (const char of header) {
    if (char === ",") {
      const recent = buffer.toLowerCase()
      const hasExpires = recent.includes("expires=")
      const hasGmt = /gmt/i.test(recent)

      if (hasExpires && !hasGmt) {
        buffer += char
        continue
      }

      if (buffer.trim()) {
        parts.push(buffer.trim())
      }
      buffer = ""
      continue
    }

    buffer += char
  }

  if (buffer.trim()) {
    parts.push(buffer.trim())
  }

  return parts
}

const parseSameSite = (value: string) => {
  switch (value) {
    case "Lax": {
      return "lax" as const
    }
    case "Strict": {
      return "strict" as const
    }
    case "None": {
      return "no_restriction" as const
    }
    default: {
      return
    }
  }
}

const parseSetCookieHeader = (header: string): ParsedSetCookie[] => {
  return splitSetCookieHeader(header)
    .map((cookie) => {
      const [nameValue, ...attributes] = cookie.split(";").map((part) => part.trim())
      const [name, ...valueParts] = nameValue?.split("=") ?? []
      if (!name) {
        return null
      }

      const parsedCookie: ParsedSetCookie = {
        name,
        value: valueParts.join("="),
        path: "/",
        httpOnly: false,
        secure: false,
      }

      for (const attribute of attributes) {
        const [rawKey, ...rawValueParts] = attribute.split("=")
        const key = rawKey?.toLowerCase()
        const value = rawValueParts.join("=")

        switch (key) {
          case "domain": {
            parsedCookie.domain = value || void 0
            break
          }
          case "expires": {
            const expires = new Date(value)
            if (!Number.isNaN(expires.getTime())) {
              parsedCookie.expirationDate = expires.getTime() / 1000
            }
            break
          }
          case "httponly": {
            parsedCookie.httpOnly = true
            break
          }
          case "max-age": {
            const maxAge = Number.parseInt(value)
            if (!Number.isNaN(maxAge)) {
              parsedCookie.maxAge = maxAge
            }
            break
          }
          case "path": {
            parsedCookie.path = value || "/"
            break
          }
          case "samesite": {
            parsedCookie.sameSite = parseSameSite(value)
            break
          }
          case "secure": {
            parsedCookie.secure = true
            break
          }
        }
      }

      return parsedCookie
    })
    .filter((cookie): cookie is ParsedSetCookie => !!cookie)
}

const isManagedAuthCookie = (cookieName: string): cookieName is ManagedAuthCookieName => {
  return MANAGED_AUTH_COOKIE_NAME_SET.has(cookieName)
}

const getKnownManagedAuthCookies = (cookies: ManagedAuthCookie[]) => {
  return cookies.filter((cookie): cookie is KnownManagedAuthCookie =>
    isManagedAuthCookie(cookie.name),
  )
}

const getCookieHeaderPriority = (cookie: ManagedAuthCookie) => {
  let priority = 0
  if (cookie.hostOnly) priority += 8
  if (cookie.value.includes(".")) priority += 4
  if (cookie.secure) priority += 2
  if ((cookie.path ?? "/") === "/") priority += 1
  return priority
}

const getPreferredCookie = <TCookie extends ManagedAuthCookie>(cookies: TCookie[]) => {
  return cookies.reduce<TCookie | null>((preferred, cookie) => {
    if (!preferred) return cookie
    return getCookieHeaderPriority(cookie) > getCookieHeaderPriority(preferred) ? cookie : preferred
  }, null)
}

const isSameStoredCookie = (a: ManagedAuthCookie, b: ManagedAuthCookie) => {
  return (
    a.name === b.name &&
    a.value === b.value &&
    (a.domain ?? "") === (b.domain ?? "") &&
    (a.path ?? "/") === (b.path ?? "/") &&
    Boolean(a.hostOnly) === Boolean(b.hostOnly)
  )
}

const buildCookieRemovalURL = (apiURL: string, cookie: ManagedAuthCookie) => {
  const url = new URL(apiURL)
  const domain = (cookie.domain || url.hostname).replace(/^\./, "")
  const hostname = cookie.hostOnly ? domain : `${COOKIE_CLEANUP_SUBDOMAIN}.${domain}`
  const path = cookie.path?.startsWith("/") ? cookie.path : "/"

  return `${url.protocol}//${hostname}${path}`
}

const removeStoredCookie = async ({
  apiURL,
  cookie,
  session,
}: {
  apiURL: string
  cookie: ManagedAuthCookie
  session: Session
}) => {
  await session.cookies.remove(buildCookieRemovalURL(apiURL, cookie), cookie.name)
}

const shouldRemoveCookie = (cookie: ParsedSetCookie) => {
  if (cookie.maxAge !== undefined) {
    return cookie.maxAge <= 0
  }

  if (cookie.expirationDate !== undefined) {
    return cookie.expirationDate <= Date.now() / 1000
  }

  return false
}

export const getManagedAuthCookieNames = () => {
  return [...MANAGED_AUTH_COOKIE_NAMES]
}

export const buildManagedAuthCookieHeaderFromSetCookieHeader = (setCookieHeader: string) => {
  if (!setCookieHeader.trim()) {
    return ""
  }

  return parseSetCookieHeader(setCookieHeader)
    .filter((cookie) => isManagedAuthCookie(cookie.name))
    .filter((cookie) => !shouldRemoveCookie(cookie))
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ")
}

export const buildManagedAuthCookieHeader = (cookies: ManagedAuthCookie[]) => {
  const selectedCookies = new Map<ManagedAuthCookieName, ManagedAuthCookie>()
  const selectedCookieNames: ManagedAuthCookieName[] = []

  getKnownManagedAuthCookies(cookies).forEach((cookie) => {
    const current = selectedCookies.get(cookie.name)
    if (!current) {
      selectedCookieNames.push(cookie.name)
      selectedCookies.set(cookie.name, cookie)
      return
    }

    if (getCookieHeaderPriority(cookie) > getCookieHeaderPriority(current)) {
      selectedCookies.set(cookie.name, cookie)
    }
  })

  if (selectedCookies.has(BETTER_AUTH_SECURE_SESSION_TOKEN_COOKIE_NAME)) {
    selectedCookies.delete(BETTER_AUTH_SESSION_TOKEN_COOKIE_NAME)
  }

  return selectedCookieNames
    .map((name) => selectedCookies.get(name))
    .filter((cookie): cookie is ManagedAuthCookie => !!cookie)
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ")
}

export const getPreferredSessionTokenCookie = (cookies: ManagedAuthCookie[]) => {
  const managedCookies = getKnownManagedAuthCookies(cookies)
  return (
    getPreferredCookie(
      managedCookies.filter(
        (cookie) => cookie.name === BETTER_AUTH_SECURE_SESSION_TOKEN_COOKIE_NAME,
      ),
    ) ||
    getPreferredCookie(
      managedCookies.filter((cookie) => cookie.name === BETTER_AUTH_SESSION_TOKEN_COOKIE_NAME),
    )
  )
}

export const getManagedAuthCookies = async ({
  apiURL,
  session,
}: {
  apiURL: string
  session: Session
}) => {
  const { hostname } = new URL(apiURL)
  const cookies = await session.cookies.get({ domain: hostname })
  return cookies.filter((cookie) => isManagedAuthCookie(cookie.name))
}

export const removeManagedAuthCookies = async ({
  apiURL,
  names,
  session,
}: {
  apiURL: string
  names?: readonly string[]
  session: Session
}) => {
  const nameSet = names ? new Set(names) : null
  const cookies = await getManagedAuthCookies({ apiURL, session })
  await Promise.all(
    cookies
      .filter((cookie) => !nameSet || nameSet.has(cookie.name))
      .map((cookie) => removeStoredCookie({ apiURL, cookie, session })),
  )
}

export const dedupeManagedAuthCookies = async ({
  apiURL,
  session,
}: {
  apiURL: string
  session: Session
}) => {
  const cookies = await getManagedAuthCookies({ apiURL, session })
  const staleCookies = new Set<Cookie>()

  for (const name of MANAGED_AUTH_COOKIE_NAMES) {
    const sameNameCookies = cookies.filter((cookie) => cookie.name === name)
    const preferred = getPreferredCookie(sameNameCookies)
    if (!preferred) continue

    sameNameCookies
      .filter((cookie) => !isSameStoredCookie(cookie, preferred))
      .forEach((cookie) => staleCookies.add(cookie))
  }

  const secureSessionCookie = getPreferredSessionTokenCookie(cookies)
  if (secureSessionCookie?.name === BETTER_AUTH_SECURE_SESSION_TOKEN_COOKIE_NAME) {
    cookies
      .filter((cookie) => cookie.name === BETTER_AUTH_SESSION_TOKEN_COOKIE_NAME)
      .forEach((cookie) => staleCookies.add(cookie))
  }

  await Promise.all(
    [...staleCookies].map((cookie) => removeStoredCookie({ apiURL, cookie, session })),
  )
}

export const persistManagedAuthCookiesFromSetCookieHeader = async ({
  apiURL,
  session,
  setCookieHeader,
}: {
  apiURL: string
  session: Session
  setCookieHeader: string
}) => {
  if (!setCookieHeader.trim()) {
    return
  }

  const cookies = parseSetCookieHeader(setCookieHeader).filter((cookie) =>
    isManagedAuthCookie(cookie.name),
  )

  for (const cookie of cookies) {
    await removeManagedAuthCookies({ apiURL, session, names: [cookie.name] })

    if (shouldRemoveCookie(cookie)) {
      continue
    }

    const details: CookiesSetDetails = {
      url: apiURL,
      name: cookie.name,
      value: cookie.value,
      path: cookie.path,
      httpOnly: cookie.httpOnly,
      secure: cookie.secure,
      ...(cookie.sameSite ? { sameSite: cookie.sameSite } : {}),
      ...(cookie.domain ? { domain: cookie.domain } : {}),
      ...(cookie.expirationDate ? { expirationDate: cookie.expirationDate } : {}),
    }

    await session.cookies.set(details)
  }

  await dedupeManagedAuthCookies({ apiURL, session })
}

import type { Cookie, CookiesSetDetails, Session } from "electron"

const MANAGED_AUTH_COOKIE_NAMES = [
  "__Secure-better-auth.session_token",
  "better-auth.session_token",
  "__Secure-better-auth.session_data",
  "better-auth.session_data",
  "better-auth.last_used_login_method",
  "dont_remember",
  "trust_device",
  "two_factor",
] as const

type ManagedAuthCookieName = (typeof MANAGED_AUTH_COOKIE_NAMES)[number]

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

export const buildManagedAuthCookieHeader = (cookies: Array<Pick<Cookie, "name" | "value">>) => {
  return cookies
    .filter((cookie) => isManagedAuthCookie(cookie.name))
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ")
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

  await Promise.all(
    cookies.map(async (cookie) => {
      if (shouldRemoveCookie(cookie)) {
        await session.cookies.remove(apiURL, cookie.name)
        return
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
    }),
  )
}

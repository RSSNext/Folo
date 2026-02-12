import type { Cookie, CookiesSetDetails, Session } from "electron"

import { BETTER_AUTH_COOKIE_NAME_SESSION_TOKEN } from "~/constants/app"

import { logger } from "../logger"

const LEGACY_PROD_API_URL = "https://api.follow.is"
const BETTER_AUTH_SESSION_DATA_COOKIE_NAME = "better-auth.session_data"

const isBetterAuthSessionCookie = (cookieName: string) => {
  return (
    cookieName.includes(BETTER_AUTH_COOKIE_NAME_SESSION_TOKEN) ||
    cookieName.includes(BETTER_AUTH_SESSION_DATA_COOKIE_NAME)
  )
}

const toCookieSetDetails = (cookie: Cookie, url: string, domain: string): CookiesSetDetails => {
  const details: CookiesSetDetails = {
    url,
    name: cookie.name,
    value: cookie.value,
    domain,
    path: cookie.path,
    secure: cookie.secure,
    httpOnly: cookie.httpOnly,
    sameSite: cookie.sameSite,
  }

  if (!cookie.session && cookie.expirationDate) {
    details.expirationDate = cookie.expirationDate
  }

  return details
}

export const migrateAuthCookiesToNewApiDomain = async (
  cookieSession: Session,
  options: {
    currentApiURL: string
    legacyApiURL?: string
  },
) => {
  const legacyApiURL = options.legacyApiURL ?? LEGACY_PROD_API_URL
  if (!options.currentApiURL || options.currentApiURL === legacyApiURL) {
    return
  }

  const currentHost = new URL(options.currentApiURL).hostname
  const legacyHost = new URL(legacyApiURL).hostname

  if (currentHost === legacyHost) {
    return
  }

  const currentDomainCookies = await cookieSession.cookies.get({
    domain: currentHost,
  })
  const hasCurrentDomainSessionCookie = currentDomainCookies.some((cookie) =>
    isBetterAuthSessionCookie(cookie.name),
  )
  if (hasCurrentDomainSessionCookie) {
    return
  }

  const legacyDomainCookies = await cookieSession.cookies.get({
    domain: legacyHost,
  })
  const legacySessionCookies = legacyDomainCookies.filter((cookie) =>
    isBetterAuthSessionCookie(cookie.name),
  )

  if (legacySessionCookies.length === 0) {
    return
  }

  await Promise.all(
    legacySessionCookies.map((cookie) => {
      return cookieSession.cookies.set(
        toCookieSetDetails(cookie, options.currentApiURL, currentHost),
      )
    }),
  )

  logger.info(
    `Migrated ${legacySessionCookies.length} auth cookie(s) from ${legacyHost} to ${currentHost}`,
  )
}

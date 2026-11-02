import { getAuthErrorMessageKey } from "@follow/utils/auth-error"

export type SocialSignInResult =
  { type: "success" } | { type: "cancel" } | { type: "error"; error: string }

// Providers report a user who backs out of their consent screen as access_denied.
const cancelledOAuthErrors = new Set(["access_denied"])

/**
 * Reads the `folo://` URL a social sign-in auth session ended on. The server appends the session
 * cookies as `cookie` on success and redirects to the error callback URL with `error` otherwise.
 */
export const parseSocialAuthCallbackURL = (
  url: string,
): { result: SocialSignInResult; cookie: string | null } => {
  const { searchParams } = new URL(url)
  const error = searchParams.get("error")
  if (error) {
    return {
      result: cancelledOAuthErrors.has(error) ? { type: "cancel" } : { type: "error", error },
      cookie: null,
    }
  }

  const cookie = searchParams.get("cookie")
  return cookie
    ? { result: { type: "success" }, cookie }
    : { result: { type: "error", error: "missing_session_cookie" }, cookie: null }
}

/**
 * The code a refused provider sign-in names, the way the redirect flow names it. The ID token
 * flow, as Sign in with Apple uses, answers OAUTH_LINK_ERROR with the reason as its message,
 * such as "account not linked", which a redirect passes as account_not_linked.
 */
export const getSocialSignInErrorCode = (
  error: { code?: string; message?: string } | null | undefined,
) =>
  error?.code === "OAUTH_LINK_ERROR" && error.message
    ? error.message.trim().replaceAll(" ", "_")
    : error?.code

/**
 * The message key, in the common locales, of a refused provider sign-in the app explains: an
 * email whose Folo account is not verified. The other codes the auth server explains are about
 * other sign-ins, such as INVALID_TOKEN for a sign-in link, which also names an Apple ID token
 * that failed verification.
 */
export const getSocialSignInFailureMessageKey = (code: string | undefined) =>
  code === "account_not_linked" ? getAuthErrorMessageKey(code) : undefined

// Mirrors @better-auth/expo: the OAuth state lives in a cookie only when the server uses the
// cookie state strategy, and the authorization proxy then has to plant it in the browser.
const getOAuthStateCookieValue = (storedCookie: string | null | undefined) => {
  if (!storedCookie) {
    return null
  }

  try {
    const cookies = JSON.parse(storedCookie) as Record<string, { value?: unknown } | undefined>
    for (const name of ["__Secure-better-auth.oauth_state", "better-auth.oauth_state"]) {
      const value = cookies[name]?.value
      if (typeof value === "string" && value) {
        return value
      }
    }
  } catch {
    // Unreadable storage means no cookie state to forward.
  }
  return null
}

/** The Better Auth Expo proxy page that stores the OAuth state in the browser, then redirects. */
export const buildAuthorizationProxyURL = ({
  authBaseURL,
  authorizationURL,
  storedCookie,
}: {
  authBaseURL: string
  authorizationURL: string
  storedCookie: string | null | undefined
}) => {
  const params = new URLSearchParams({ authorizationURL })
  const oauthState = getOAuthStateCookieValue(storedCookie)
  if (oauthState) {
    params.append("oauthState", oauthState)
  }
  return `${authBaseURL}/expo-authorization-proxy?${params.toString()}`
}

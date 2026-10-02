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

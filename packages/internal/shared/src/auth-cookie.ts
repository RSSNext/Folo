export const BETTER_AUTH_SESSION_TOKEN_COOKIE_NAME = "better-auth.session_token"
export const BETTER_AUTH_SECURE_SESSION_TOKEN_COOKIE_NAME = "__Secure-better-auth.session_token"

const LOCALHOST_HOSTNAMES = new Set(["localhost", "127.0.0.1"])

export const getBetterAuthSessionTokenCookieName = (apiURL: string) => {
  const url = new URL(apiURL)
  return url.protocol === "https:" && !LOCALHOST_HOSTNAMES.has(url.hostname)
    ? BETTER_AUTH_SECURE_SESSION_TOKEN_COOKIE_NAME
    : BETTER_AUTH_SESSION_TOKEN_COOKIE_NAME
}

export const buildBetterAuthSessionTokenCookieHeader = (apiURL: string, token: string) => {
  return `${getBetterAuthSessionTokenCookieName(apiURL)}=${token}`
}

/**
 * Codes Folo's auth server refuses a sign-in with, in an error's `code` or in the `error`
 * parameter of the address a sign-in that left the app comes back to, such as a sign-in link or
 * a provider's consent page. The values are the keys of their messages in the common locales.
 */
const AUTH_ERROR_MESSAGE_KEYS = {
  // A provider's account for an email whose Folo account is not verified yet
  account_not_linked: "auth.error.account_not_linked",
  // A sign-in or verification link that was used already, or is not one at all
  INVALID_TOKEN: "auth.error.invalid_token",
  TOKEN_EXPIRED: "auth.error.invalid_token",
  // A sign-in link for an account with two-factor authentication
  TWO_FACTOR_REQUIRED: "auth.error.two_factor_required",
} as const

/** The message of a sign-in that came back with an error the server has no message key for */
export const AUTH_SIGN_IN_FAILED_MESSAGE_KEY = "auth.error.sign_in_failed"

export type AuthErrorMessageKey =
  | (typeof AUTH_ERROR_MESSAGE_KEYS)[keyof typeof AUTH_ERROR_MESSAGE_KEYS]
  | typeof AUTH_SIGN_IN_FAILED_MESSAGE_KEY

/** The key, in the common locales, of the message of a code the auth server answers with */
export const getAuthErrorMessageKey = (code: unknown): AuthErrorMessageKey | undefined =>
  typeof code === "string" && Object.hasOwn(AUTH_ERROR_MESSAGE_KEYS, code)
    ? AUTH_ERROR_MESSAGE_KEYS[code as keyof typeof AUTH_ERROR_MESSAGE_KEYS]
    : undefined

/** The error a sign-in that left the app came back with, from the query of the address */
export const readAuthRedirectError = (search: string): string | null =>
  new URLSearchParams(search).get("error") || null

/** The query without the error a sign-in came back with, such as `?view=1`, or "" */
export const withoutAuthRedirectError = (search: string): string => {
  const params = new URLSearchParams(search)
  params.delete("error")
  params.delete("error_description")
  const rest = params.toString()
  return rest ? `?${rest}` : ""
}

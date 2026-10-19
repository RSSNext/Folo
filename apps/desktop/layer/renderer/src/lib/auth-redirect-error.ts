import type { AuthErrorMessageKey } from "@follow/utils/auth-error"
import {
  AUTH_SIGN_IN_FAILED_MESSAGE_KEY,
  getAuthErrorMessageKey,
  readAuthRedirectError,
} from "@follow/utils/auth-error"

/**
 * A sign-in that left the app, through a sign-in link or a provider's consent page, comes back
 * to the web app with `?error=<code>` when the server refused it. Read once at startup, before
 * the first route moves on to the timeline without the query.
 */
let pendingError =
  typeof window === "undefined" ? null : readAuthRedirectError(window.location.search)

/** Why the sign-in this page load came back from failed, given once */
export const takeAuthRedirectError = ():
  { code: string; messageKey: AuthErrorMessageKey; explained: boolean } | undefined => {
  const code = pendingError
  pendingError = null
  if (!code) return undefined
  const messageKey = getAuthErrorMessageKey(code)
  return {
    code,
    messageKey: messageKey ?? AUTH_SIGN_IN_FAILED_MESSAGE_KEY,
    explained: !!messageKey,
  }
}

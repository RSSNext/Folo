/** However many requests a dead session fails, the session endpoint is asked at most this often. */
const MIN_CHECK_INTERVAL_MS = 30_000

interface UnauthorizedSessionCheckOptions {
  /** Whether the app still shows a signed-in user. */
  isSignedIn: () => boolean
  /** Ask the session endpoint; resolves to `null` when the session is gone. */
  fetchSession: () => Promise<unknown>
  /** Changes whenever the stored session changes, such as by a sign-in. */
  getAuthRevision: () => number
  onSessionGone: () => void | Promise<void>
  now?: () => number
}

/**
 * A request sent with the current session was refused. The session may be gone, revoked from
 * another device for instance, or only that endpoint refused it, so the session endpoint
 * decides; the app signs out locally only when it says the session is gone.
 */
export const createUnauthorizedSessionCheck = ({
  isSignedIn,
  fetchSession,
  getAuthRevision,
  onSessionGone,
  now = Date.now,
}: UnauthorizedSessionCheckOptions) => {
  let checking = false
  let lastCheckAt = Number.NEGATIVE_INFINITY

  return async () => {
    // Already signed out locally: the login screen is up and nothing is left to find out.
    if (checking || !isSignedIn()) return
    if (now() - lastCheckAt < MIN_CHECK_INTERVAL_MS) return
    checking = true
    lastCheckAt = now()
    const revision = getAuthRevision()
    try {
      const session = await fetchSession()
      // A sign-in while the check was on its way replaced the session it asked about.
      if (session === null && revision === getAuthRevision()) {
        await onSessionGone()
      }
    } catch {
      // The endpoint could not be reached, so nothing is known; a later refusal asks again.
    } finally {
      checking = false
    }
  }
}

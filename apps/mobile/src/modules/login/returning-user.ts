import { kv } from "@/src/lib/kv"

/**
 * Someone signed in on this device before, so the sign-in screen opens on signing in rather
 * than on signing up, as after a session expired or was revoked, or after signing out.
 */
const SIGNED_IN_BEFORE_KEY = "login:signed-in-before"

export const rememberSignedIn = () => {
  try {
    kv.setSync(SIGNED_IN_BEFORE_KEY, "1")
  } catch (error) {
    console.warn("[login] could not remember the sign-in", error)
  }
}

export const hasSignedInBefore = () => {
  try {
    return kv.getSync(SIGNED_IN_BEFORE_KEY) === "1"
  } catch {
    // Signing up is one tap away
    return false
  }
}

import { isOnboardingFinishedStorageKey } from "@follow/store/user/constants"

import { kv } from "./kv"
import { safeSecureStore } from "./secure-store"

// SecureStore keys may only hold alphanumerics, ".", "-" and "_"; any other character throws
const onboardingFinishedBackupKey = `${isOnboardingFinishedStorageKey}.persistent`

export const markOnboardingFinished = async () => {
  await kv.set(isOnboardingFinishedStorageKey, "true")
  try {
    safeSecureStore.setItem(onboardingFinishedBackupKey, "true")
  } catch (error) {
    console.warn("[onboarding] failed to back up the finished flag", error)
  }
}

export const hasFinishedOnboarding = async () => {
  const finished = await kv.get(isOnboardingFinishedStorageKey)
  if (finished === "true") {
    return true
  }

  let persistedFinished: string | null = null
  try {
    persistedFinished = safeSecureStore.getItem(onboardingFinishedBackupKey)
  } catch (error) {
    // Without the backup the onboarding shows again, which beats never showing it
    console.warn("[onboarding] failed to read the finished flag backup", error)
  }
  if (persistedFinished === "true") {
    await kv.set(isOnboardingFinishedStorageKey, "true")
    return true
  }

  return false
}

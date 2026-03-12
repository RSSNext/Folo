import { isOnboardingFinishedStorageKey } from "@follow/store/user/constants"

import { kv } from "./kv"
import { safeSecureStore } from "./secure-store"

const onboardingFinishedBackupKey = `${isOnboardingFinishedStorageKey}:persistent`

export const markOnboardingFinished = async () => {
  await kv.set(isOnboardingFinishedStorageKey, "true")
  safeSecureStore.setItem(onboardingFinishedBackupKey, "true")
}

export const hasFinishedOnboarding = async () => {
  const finished = await kv.get(isOnboardingFinishedStorageKey)
  if (finished === "true") {
    return true
  }

  const persistedFinished = safeSecureStore.getItem(onboardingFinishedBackupKey)
  if (persistedFinished === "true") {
    await kv.set(isOnboardingFinishedStorageKey, "true")
    return true
  }

  return false
}

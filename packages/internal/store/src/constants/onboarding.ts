import { getEntry } from "../modules/entry/getter"

const ONBOARDING_ENTRY_URL_PREFIX = "follow://onboarding"

export const isOnboardingEntryUrl = (url?: string | null) => {
  return typeof url === "string" && url.startsWith(ONBOARDING_ENTRY_URL_PREFIX)
}

export const isOnboardingEntry = (entryId: string) => {
  return isOnboardingEntryUrl(getEntry(entryId)?.url)
}

export const isOnboardingFeedUrl = (url?: string | null) => {
  return typeof url === "string" && url.startsWith(ONBOARDING_ENTRY_URL_PREFIX)
}

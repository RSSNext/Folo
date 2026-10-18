import { deleteDB } from "@follow/database/db"
import { clearStorage, getStorageNS } from "@follow/utils/ns"

import { getAuthSessionToken, setAuthSessionToken } from "~/lib/client-session"
import { reloadAtAppRoot } from "~/lib/reload-at-app-root"

import { clearImageDimensionsDb } from "../image/db"

export const clearLocalPersistStoreData = async () => {
  await Promise.all([deleteDB(), clearImageDimensionsDb()])
}

/**
 * Signed in to another account than the one whose data is in the local database, after that
 * one's session ended without a sign-out. The data on screen, the changes still queued and the
 * settings belong to the account before, so start over as a sign-out does, keeping the new
 * session. Settings left in place would be uploaded to the new account on its first sync, AI
 * provider keys included, and its integrations would save to the other account's services.
 */
export const clearLocalDataOfAnotherAccount = async () => {
  await clearLocalPersistStoreData()
  const authSessionToken = getAuthSessionToken()
  // The query cache and every setting of the account before, as a sign-out clears them
  clearStorage()
  if (authSessionToken) setAuthSessionToken(authSessionToken)
  reloadAtAppRoot()
}

const storedUserId = getStorageNS("user_id")
export const clearDataIfLoginOtherAccount = (newUserId: string) => {
  const oldUserId = localStorage.getItem(storedUserId)
  localStorage.setItem(storedUserId, newUserId)
  if (oldUserId !== newUserId) {
    return clearLocalPersistStoreData()
  }
}

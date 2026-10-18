import { deleteDB } from "@follow/database/db"
import { getStorageNS } from "@follow/utils/ns"

import { QUERY_PERSIST_KEY } from "~/constants/app"

import { clearImageDimensionsDb } from "../image/db"

export const clearLocalPersistStoreData = async () => {
  await Promise.all([deleteDB(), clearImageDimensionsDb()])
}

/**
 * Signed in to another account than the one whose data is in the local database, after that
 * one's session ended without a sign-out. The data on screen and the changes still queued
 * belong to the account before, so start over as a sign-out does, keeping the new session.
 */
export const clearLocalDataOfAnotherAccount = async () => {
  localStorage.removeItem(QUERY_PERSIST_KEY)
  await clearLocalPersistStoreData()
  window.location.reload()
}

const storedUserId = getStorageNS("user_id")
export const clearDataIfLoginOtherAccount = (newUserId: string) => {
  const oldUserId = localStorage.getItem(storedUserId)
  localStorage.setItem(storedUserId, newUserId)
  if (oldUserId !== newUserId) {
    return clearLocalPersistStoreData()
  }
}

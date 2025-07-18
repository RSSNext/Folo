import { deleteDB } from "@follow/database/db"
import { getStorageNS } from "@follow/utils/ns"

import { clearUISettings } from "~/atoms/settings/ui"

import { clearImageDimensionsDb } from "../image/db"

export const clearLocalPersistStoreData = async () => {
  await Promise.all([deleteDB(), clearImageDimensionsDb()])

  clearUISettings()
}

const storedUserId = getStorageNS("user_id")
export const clearDataIfLoginOtherAccount = (newUserId: string) => {
  const oldUserId = localStorage.getItem(storedUserId)
  localStorage.setItem(storedUserId, newUserId)
  if (oldUserId !== newUserId) {
    return clearLocalPersistStoreData()
  }
}

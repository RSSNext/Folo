import { getStorageNS } from "@follow/utils/ns"

import { clearUISettings } from "~/atoms/settings/ui"
import { browserDB } from "~/database"

import { entryActions } from "../entry"
import { feedActions } from "../feed"
import { clearImageDimensionsDb } from "../image/db"
import { inboxActions } from "../inbox"
import { listActions } from "../list"
import { subscriptionActions } from "../subscription"
import { feedUnreadActions } from "../unread"

export const clearLocalPersistStoreData = async () => {
  // All clear and reset method will aggregate here
  ;[
    entryActions,
    subscriptionActions,
    feedUnreadActions,
    feedActions,
    listActions,
    inboxActions,
  ].forEach((actions) => {
    actions.clear()
  })

  clearUISettings()

  await clearImageDimensionsDb()
  await Promise.all(browserDB.tables.map((table) => table.clear()))
}

const storedUserId = getStorageNS("user_id")
export const clearDataIfLoginOtherAccount = (newUserId: string) => {
  const oldUserId = localStorage.getItem(storedUserId)
  localStorage.setItem(storedUserId, newUserId)
  if (oldUserId !== newUserId) {
    return clearLocalPersistStoreData()
  }
}

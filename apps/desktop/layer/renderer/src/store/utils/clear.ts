import { feedActions } from "@follow/store/feed/store"
import { inboxActions } from "@follow/store/inbox/store"
import { listActions } from "@follow/store/list/store"
import { unreadActions } from "@follow/store/unread/store"
import { getStorageNS } from "@follow/utils/ns"

import { clearUISettings } from "~/atoms/settings/ui"
import { browserDB } from "~/database"

import { entryActions } from "../entry"
import { clearImageDimensionsDb } from "../image/db"
import { subscriptionActions } from "../subscription"

export const clearLocalPersistStoreData = async () => {
  // All clear and reset method will aggregate here
  ;[
    entryActions,
    subscriptionActions,
    unreadActions,
    feedActions,
    listActions,
    inboxActions,
  ].forEach((actions) => {
    "clear" in actions && actions.clear()
    "reset" in actions && actions.reset()
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

import { entryActions } from "@follow/store/entry/store"
import { feedActions } from "@follow/store/feed/store"
import { inboxActions } from "@follow/store/inbox/store"
import { listActions } from "@follow/store/list/store"
import { subscriptionActions } from "@follow/store/subscription/store"
import { unreadActions } from "@follow/store/unread/store"
import { getStorageNS } from "@follow/utils/ns"

import { clearUISettings } from "~/atoms/settings/ui"

import { clearImageDimensionsDb } from "../image/db"

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
    actions.reset()
  })

  clearUISettings()

  await clearImageDimensionsDb()
}

const storedUserId = getStorageNS("user_id")
export const clearDataIfLoginOtherAccount = (newUserId: string) => {
  const oldUserId = localStorage.getItem(storedUserId)
  localStorage.setItem(storedUserId, newUserId)
  if (oldUserId !== newUserId) {
    return clearLocalPersistStoreData()
  }
}

import type { InboxModel } from "@follow/models/types"

import { runTransactionInScope } from "~/database"
import { apiClient } from "~/lib/api-fetch"
import { InboxService } from "~/services/inbox"

import { createImmerSetter, createTransaction, createZustandStore } from "../utils/helper"
import type { InboxState } from "./types"

export const useInboxStore = createZustandStore<InboxState>("inbox")(() => ({
  inboxes: {},
}))

const set = createImmerSetter(useInboxStore)
const get = useInboxStore.getState
class InboxActionStatic {
  upsertMany(inboxes: InboxModel[]) {
    if (inboxes.length === 0) return
    set((state) => {
      for (const inbox of inboxes) {
        state.inboxes[inbox.id] = inbox
      }
      return state
    })

    runTransactionInScope(() => InboxService.upsertMany(inboxes))
  }

  async fetchInboxById(id: string) {
    const res = await apiClient.inboxes.$get({
      query: {
        handle: id,
      },
    })
    this.upsertMany([res.data])

    return res.data
  }

  clear() {
    set((state) => {
      state.inboxes = {}
    })
  }

  private clearByInboxId(id: string) {
    set((state) => {
      delete state.inboxes[id]
    })
  }

  async deleteInbox(inboxId: string) {
    const inbox = get().inboxes[inboxId]
    const tx = createTransaction(inbox)
    tx.execute(async () => {
      await apiClient.inboxes.$delete({
        json: {
          handle: inboxId,
        },
      })
    })

    tx.optimistic(async () => this.clearByInboxId(inboxId))
    tx.persist(() => InboxService.bulkDelete([inboxId]))
    tx.rollback(async (inbox) => this.upsertMany([inbox]))
    await tx.run()
  }

  async fetchOwnedInboxes() {
    const res = await apiClient.inboxes.list.$get()
    this.upsertMany(res.data)

    return res.data
  }
}

export const inboxActions = new InboxActionStatic()

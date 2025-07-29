import type { InboxSchema } from "@follow/database/schemas/types"
import { InboxService } from "@follow/database/services/inbox"

import { apiClient } from "../context"
import type { Hydratable, Resetable } from "../internal/base"
import { createImmerSetter, createTransaction, createZustandStore } from "../internal/helper"
import type { InboxModel } from "./types"

interface InboxState {
  inboxes: Record<string, InboxModel>
}

const defaultState = {
  inboxes: {},
}

export const useInboxStore = createZustandStore<InboxState>("inbox")(() => defaultState)

const get = useInboxStore.getState
const set = useInboxStore.setState
const immerSet = createImmerSetter(useInboxStore)

class InboxActions implements Hydratable, Resetable {
  async hydrate() {
    const inboxes = await InboxService.getInboxAll()
    inboxActions.upsertManyInSession(inboxes)
  }
  async upsertManyInSession(inboxes: InboxSchema[]) {
    const state = useInboxStore.getState()
    const nextInboxes: InboxState["inboxes"] = {
      ...state.inboxes,
    }
    inboxes.forEach((inbox) => {
      nextInboxes[inbox.id] = {
        type: "inbox",
        ...inbox,
      }
    })
    set({
      ...state,
      inboxes: nextInboxes,
    })
  }
  async upsertMany(inboxes: InboxSchema[]) {
    const tx = createTransaction()
    tx.store(() => {
      this.upsertManyInSession(inboxes)
    })
    tx.persist(() => {
      return InboxService.upsertMany(inboxes)
    })
    tx.run()
  }

  deleteById(id: string) {
    immerSet((state) => {
      delete state.inboxes[id]
    })
  }

  async reset() {
    const tx = createTransaction()
    tx.store(() => {
      set(defaultState)
    })

    tx.persist(() => {
      return InboxService.reset()
    })

    await tx.run()
  }
}

class InboxSyncService {
  async createInbox({ handle, title }: { handle: string; title: string }) {
    const newInbox = {
      id: handle,
      title,
      secret: "",
    }
    const tx = createTransaction()
    tx.store(async () => {
      await inboxActions.upsertManyInSession([newInbox])
    })
    tx.request(async () => {
      await apiClient().inboxes.$post({
        json: {
          handle,
          title,
        },
      })
    })

    tx.persist(() => InboxService.upsertMany([newInbox]))
    tx.rollback(() => inboxActions.deleteById(handle))
    await tx.run()
  }

  async updateInbox({ handle, title }: { handle: string; title: string }) {
    const existingInbox = get().inboxes[handle]
    if (!existingInbox) return

    const newInbox = {
      ...existingInbox,
      title,
    }
    const tx = createTransaction()
    tx.store(async () => {
      await inboxActions.upsertManyInSession([newInbox])
    })
    tx.request(async () => {
      await apiClient().inboxes.$put({
        json: {
          handle,
          title,
        },
      })
    })

    tx.persist(() => InboxService.upsertMany([newInbox]))
    tx.rollback(() => inboxActions.upsertMany([existingInbox]))
    await tx.run()
  }

  async deleteInbox(inboxId: string) {
    const inbox = get().inboxes[inboxId]
    if (!inbox) return

    const tx = createTransaction(inbox)
    tx.store(async () => inboxActions.deleteById(inboxId))
    tx.request(async () => {
      await apiClient().inboxes.$delete({
        json: {
          handle: inboxId,
        },
      })
    })

    tx.persist(() => InboxService.deleteById(inboxId))
    tx.rollback(async (inbox) => inboxActions.upsertMany([inbox]))
    await tx.run()
  }
}

export const inboxActions = new InboxActions()
export const inboxSyncService = new InboxSyncService()

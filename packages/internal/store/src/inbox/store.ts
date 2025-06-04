import type { InboxSchema } from "@follow/database/schemas/types"
import { InboxService } from "@follow/database/services/inbox"

import type { Hydratable } from "../internal/base"
import { createTransaction, createZustandStore } from "../internal/helper"

interface InboxState {
  inboxes: Record<string, InboxSchema>
}

const defaultState = {
  inboxes: {},
}

export const useInboxStore = createZustandStore<InboxState>("inbox")(() => defaultState)

// const get = useInboxStore.getState
const set = useInboxStore.setState
class InboxActions implements Hydratable {
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
      nextInboxes[inbox.id] = inbox
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

  reset() {
    set(defaultState)
  }
}

export const inboxActions = new InboxActions()

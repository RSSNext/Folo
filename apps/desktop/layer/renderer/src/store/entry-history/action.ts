import { apiClient } from "~/lib/api-fetch"

import { entryActions } from "../entry/store"
import { userActions } from "../user"

class EntryHistoryActions {
  async fetchEntryHistory(entryId: string) {
    const { data } = await apiClient.entries["read-histories"][":id"].$get({
      param: {
        id: entryId,
      },
      query: {
        page: 1,
        size: 100,
      },
    })

    userActions.upsert(data.users)
    if (data.entryReadHistories) {
      entryActions.updateReadHistory(entryId, data.entryReadHistories)
    }

    return data
  }
}

export const entryHistoryActions = new EntryHistoryActions()

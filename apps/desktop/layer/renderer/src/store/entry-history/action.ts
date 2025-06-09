import { userActions } from "@follow/store/user/store"

import { apiClient } from "~/lib/api-fetch"

import { entryActions } from "../entry/store"

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

    userActions.upsertMany(Object.values(data.users || {}))
    if (data.entryReadHistories) {
      entryActions.updateReadHistory(entryId, data.entryReadHistories)
    }

    return data
  }
}

export const entryHistoryActions = new EntryHistoryActions()

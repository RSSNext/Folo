import { followClient } from "~/lib/api-client"
import { defineQuery } from "~/lib/defineQuery"
import { getEntriesParams } from "~/lib/utils"

export const entries = {
  preview: (id: string) =>
    defineQuery(
      ["entries-preview", id],
      async () => {
        const res = await followClient.api.entries.preview({
          id,
        })

        return res.data
      },
      {
        rootKey: ["entries-preview"],
      },
    ),

  checkNew: ({
    feedId,
    inboxId,
    listId,
    view,
    read,
    fetchedTime,
  }: {
    feedId?: number | string
    inboxId?: number | string
    listId?: number | string
    view?: number
    read?: boolean
    fetchedTime: number
  }) =>
    defineQuery(
      ["entry-checkNew", inboxId || listId || feedId, view, read, fetchedTime],
      async () => {
        const query = {
          ...getEntriesParams({
            feedId,
            inboxId,
            listId,
            view,
          }),
          read,
          insertedAfter: fetchedTime,
        }

        if (query.feedIdList && query.feedIdList.length === 1) {
          query.feedId = query.feedIdList[0]
          delete query.feedIdList
        }
        return followClient.api.entries.checkNew({
          insertedAfter: query.insertedAfter,
          view: query.view,
          feedId: query.feedId,
          read: typeof query.read === "boolean" ? query.read : undefined,
          feedIdList: query.feedIdList,
        })
      },

      {
        rootKey: ["entry-checkNew", inboxId || listId || feedId],
      },
    ),
}

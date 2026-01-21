import { followClient } from "~/lib/api-client"
import { defineQuery } from "~/lib/defineQuery"

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
}

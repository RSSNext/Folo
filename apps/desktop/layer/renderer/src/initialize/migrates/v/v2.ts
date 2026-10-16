import { migrateFeedListSortByName } from "~/modules/subscription-column/atom"

import { defineMigration } from "../helper"

export const v2 = defineMigration({
  version: "v2",
  migrate: () => {
    // The subscription list's name order used to be reversed
    migrateFeedListSortByName()
  },
})

import { getCategoryFeedIds } from "@follow/store/subscription/getter"

import { ROUTE_FEED_IN_FOLDER } from "~/constants"
import { getRouteParams } from "~/hooks/biz/useRouteParams"

import type { MentionData } from "../types"

export function getMentionTextValue(mentionData: MentionData): string {
  const { type, value } = mentionData

  if (type === "date" && value) {
    return value as string
  }

  if (type === "category" && typeof value === "string" && value.startsWith(ROUTE_FEED_IN_FOLDER)) {
    const { view } = getRouteParams()
    const ids = getCategoryFeedIds(value.slice(ROUTE_FEED_IN_FOLDER.length), view)
    return `<mention-feed ids=${JSON.stringify(ids)}></mention-feed>`
  }

  return `<mention-${type} id="${value}"></mention-${type}>`
}

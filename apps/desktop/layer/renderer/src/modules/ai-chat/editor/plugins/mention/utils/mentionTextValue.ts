import { getView } from "@follow/constants"
import { getFeedById } from "@follow/store/feed/getter"
import { getCategoryFeedIds } from "@follow/store/subscription/getter"

import { ROUTE_FEED_IN_FOLDER } from "~/constants"
import { getRouteParams } from "~/hooks/biz/useRouteParams"
import { getI18n } from "~/i18n"

import type { LabelTranslator } from "../hooks/dateMentionUtils"
import { getDateMentionDisplayName } from "../hooks/dateMentionUtils"
import type { MentionData } from "../types"

export function getMentionTextValue(mentionData: {
  type: MentionData["type"]
  value: MentionData["value"]
}): string {
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

export function getMentionDisplayTextValue(
  mentionData: MentionData,
  translate: LabelTranslator,
  locale: string,
): string {
  const { type, value } = mentionData

  switch (type) {
    case "category": {
      if (typeof value === "string" && value.startsWith(ROUTE_FEED_IN_FOLDER)) {
        const { view } = getRouteParams()
        const ids = getCategoryFeedIds(value.slice(ROUTE_FEED_IN_FOLDER.length), view)
        const feedNames = ids.map((id) => getFeedById(id)?.title).join(", ")
        return feedNames
      }
      return "Unknown Category"
    }

    case "view": {
      const viewDef = getView(value)
      const viewKey = viewDef?.name

      if (viewKey) {
        return getI18n().t(viewKey, { ns: "common" })
      }
      return "Unknown View"
    }

    case "date": {
      return getDateMentionDisplayName(mentionData, translate, locale, true)
    }
    default: {
      return value
    }
  }
}

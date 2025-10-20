import { getViewList } from "@follow/constants"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { useFeedEntrySearchService } from "~/modules/ai-chat/hooks/useFeedEntrySearchService"

import type { MentionData, MentionType } from "../types"
import { createDateMentionBuilder, MAX_INLINE_DATE_SUGGESTIONS } from "./dateMentionSearch"

/**
 * Hook that provides search functionality for mentions
 * Uses the shared feed/entry search service
 */
export const useMentionSearchService = () => {
  const { t, i18n } = useTranslation("ai")
  const language = i18n.language || i18n.resolvedLanguage || "en"
  const { search } = useFeedEntrySearchService()

  const buildDateMentions = useMemo(() => createDateMentionBuilder({ t, language }), [t, language])

  const searchMentions = useMemo(() => {
    return async (query: string, type?: MentionType): Promise<MentionData[]> => {
      const trimmedQuery = query.trim()
      const results: MentionData[] = []
      const seen = new Set<string>()

      const pushResult = (mention: MentionData) => {
        const key = `${mention.type}:${String(mention.value)}`
        if (!seen.has(key)) {
          seen.add(key)
          results.push(mention)
        }
      }

      if (type === "date") {
        buildDateMentions(trimmedQuery).forEach(pushResult)
        return results
      }

      if (type === "feed" || type === "entry" || type === "category") {
        const searchResults = search(trimmedQuery, type, 10)
        searchResults.forEach((item) =>
          pushResult({
            id: item.id,
            name: item.title,
            type: item.type,
            value: item.id,
          }),
        )
        return results
      }

      const views = getViewList()
      const lowerQuery = trimmedQuery.toLowerCase()

      const firstView = views.find((view) => {
        // @ts-expect-error
        const viewName = t(view.name, { ns: "common" }).toLowerCase()
        return viewName.includes(lowerQuery) || lowerQuery === ""
      })

      if (firstView) {
        pushResult({
          id: `view-${firstView.view}`,
          name: t(firstView.name, { ns: "common" }),
          type: "view",
          value: firstView.view,
        })
      }

      const dateSuggestions = buildDateMentions(trimmedQuery)
      dateSuggestions.slice(0, MAX_INLINE_DATE_SUGGESTIONS).forEach(pushResult)

      const searchResults = search(trimmedQuery, undefined, 10)
      searchResults.forEach((item) =>
        pushResult({
          id: item.id,
          name: item.title,
          type: item.type,
          value: item.id,
        }),
      )

      return results
    }
  }, [buildDateMentions, search, t])

  return { searchMentions }
}

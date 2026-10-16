import { useQuery } from "@tanstack/react-query"
import { useAtomValue } from "jotai"
import { useTranslation } from "react-i18next"
import { useWindowDimensions, View } from "react-native"

import { Text } from "@/src/components/ui/typography/Text"
import { followClient } from "@/src/lib/api-client"

import { useSearchPageContext } from "../ctx"
import { ItemSeparator } from "./__base"
import { SearchErrorView, useDataSkeleton } from "./hooks"
import { resolveSearchFeedItems } from "./search-feed-items"
import { SearchFeedCard } from "./SearchFeedCard"

export const SearchFeed = () => {
  const { t } = useTranslation("common")
  const { searchValueAtom } = useSearchPageContext()
  const searchValue = useAtomValue(searchValueAtom)
  const windowWidth = useWindowDimensions().width
  const { data, error, isFetching, refetch } = useQuery({
    queryKey: ["searchFeed", searchValue],
    queryFn: () => {
      return followClient.api.discover.discover({ keyword: searchValue, target: "feeds" })
    },
    enabled: !!searchValue,
  })
  const discoveredItems = data?.data ?? []
  const items = resolveSearchFeedItems(discoveredItems, searchValue)
  // A retry after an error has no data either and shows the spinner again
  const skeleton = useDataSkeleton(
    isFetching && data === undefined,
    data === undefined ? undefined : items.length,
  )
  if (skeleton) return skeleton
  if (data === undefined) {
    return error ? <SearchErrorView error={error} onRetry={() => void refetch()} /> : null
  }

  const resultCount = items.length
  const resultLabel =
    resultCount === 0
      ? t("discover.search.results_zero")
      : t("discover.search.results", { count: resultCount })

  return (
    <View
      style={{
        width: windowWidth,
      }}
    >
      <Text className="px-6 pt-4 text-text/60">{resultLabel}</Text>
      <View>
        {items.map((item, index) => (
          // Feeds the server has not stored yet have an empty id, so fall back to their URL
          <View key={item.feed?.id || item.feed?.url || `feed-${index}`}>
            <SearchFeedCard item={item} />
            <ItemSeparator />
          </View>
        ))}
      </View>
    </View>
  )
}

import { useQuery } from "@tanstack/react-query"
import { useAtomValue } from "jotai"
import { useTranslation } from "react-i18next"
import { useWindowDimensions, View } from "react-native"

import { Text } from "@/src/components/ui/typography/Text"
import { followClient } from "@/src/lib/api-client"

import { useSearchPageContext } from "../ctx"
import { ItemSeparator } from "./__base"
import { useDataSkeleton } from "./hooks"
import type { SearchFeedCardItem } from "./SearchFeedCard"
import { SearchFeedCard } from "./SearchFeedCard"

const isDirectFeedInput = (value: string) => value.includes("://")

const createDirectFeedItem = (value: string): SearchFeedCardItem => ({
  feed: {
    title: value,
    url: value,
  },
})

export const SearchFeed = () => {
  const { t } = useTranslation("common")
  const { searchValueAtom } = useSearchPageContext()
  const searchValue = useAtomValue(searchValueAtom)
  const windowWidth = useWindowDimensions().width
  const { data, isLoading } = useQuery({
    queryKey: ["searchFeed", searchValue],
    queryFn: () => {
      return followClient.api.discover.discover({ keyword: searchValue, target: "feeds" })
    },
    enabled: !!searchValue,
  })
  const skeleton = useDataSkeleton(isLoading, data)
  if (skeleton) return skeleton
  if (data === undefined) return null

  const discoveredItems = data.data ?? []
  const items =
    discoveredItems.length > 0
      ? discoveredItems
      : searchValue && isDirectFeedInput(searchValue)
        ? [createDirectFeedItem(searchValue)]
        : []

  const resultCount = items.length
  const resultLabel =
    resultCount === 0
      ? t("discover.search.results_zero")
      : t("discover.search.results_other", { count: resultCount })

  return (
    <View
      style={{
        width: windowWidth,
      }}
    >
      <Text className="px-6 pt-4 text-text/60">{resultLabel}</Text>
      <View>
        {items.map((item, index) => (
          <View key={item.feed?.id ?? item.feed?.url ?? `feed-${index}`}>
            <SearchFeedCard item={item} />
            <ItemSeparator />
          </View>
        ))}
      </View>
    </View>
  )
}

import { useQuery } from "@tanstack/react-query"
import { useAtomValue } from "jotai"
import { useTranslation } from "react-i18next"
import { useWindowDimensions, View } from "react-native"

import { Text } from "@/src/components/ui/typography/Text"
import { followClient } from "@/src/lib/api-client"

import { useSearchPageContext } from "../ctx"
import { ItemSeparator } from "./__base"
import { useDataSkeleton } from "./hooks"
import { SearchFeedCard } from "./SearchFeedCard"

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
  const resultCount = data.data?.length ?? 0
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
        {data.data?.map((item, index) => (
          <View key={item.feed?.id ?? `feed-${index}`}>
            <SearchFeedCard item={item} />
            <ItemSeparator />
          </View>
        ))}
      </View>
    </View>
  )
}

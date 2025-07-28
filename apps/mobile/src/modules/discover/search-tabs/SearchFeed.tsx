import { useQuery } from "@tanstack/react-query"
import { useAtomValue } from "jotai"
import { useWindowDimensions, View } from "react-native"

import { Text } from "@/src/components/ui/typography/Text"
import { apiClient } from "@/src/lib/api-fetch"

import { useSearchPageContext } from "../ctx"
import { ItemSeparator } from "./__base"
import { useDataSkeleton } from "./hooks"
import { SearchFeedCard } from "./SearchFeedCard"

export const SearchFeed = () => {
  const { searchValueAtom } = useSearchPageContext()
  const searchValue = useAtomValue(searchValueAtom)
  const windowWidth = useWindowDimensions().width
  const { data, isLoading } = useQuery({
    queryKey: ["searchFeed", searchValue],
    queryFn: () => {
      return apiClient.discover.$post({
        json: {
          keyword: searchValue,
          target: "feeds",
        },
      })
    },
    enabled: !!searchValue,
  })
  const skeleton = useDataSkeleton(isLoading, data)
  if (skeleton) return skeleton
  if (data === undefined) return null
  return (
    <View
      style={{
        width: windowWidth,
      }}
    >
      <Text className="text-text/60 px-6 pt-4">Found {data.data?.length} feeds</Text>
      <View>
        {data.data?.map((item) => (
          <View key={item.feed?.id || Math.random().toString()}>
            <SearchFeedCard item={item} />
            <ItemSeparator />
          </View>
        ))}
      </View>
    </View>
  )
}

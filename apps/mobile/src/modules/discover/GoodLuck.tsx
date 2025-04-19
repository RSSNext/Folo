import { RSSHubCategories } from "@follow/constants"
import type { RSSHubRouteDeclaration } from "@follow/models/src/rsshub"
import { useQuery } from "@tanstack/react-query"
import { shuffle } from "es-toolkit/compat"
import { useMemo } from "react"
import { View } from "react-native"

import { PlatformActivityIndicator } from "@/src/components/ui/loading/PlatformActivityIndicator"

import { fetchRsshubPopular } from "./api"
import { RecommendationListItem } from "./RecommendationListItem"

export const GoodLuck = () => {
  const randomTab = useMemo(
    () => RSSHubCategories[Math.floor(Math.random() * RSSHubCategories.length)]!,
    [],
  )
  const { data, isLoading } = useQuery({
    queryKey: ["rsshub-popular", "cache", randomTab],
    queryFn: () => fetchRsshubPopular(randomTab, "all").then((res) => res.data),
  })

  const arr = useMemo(() => {
    if (!data) return []
    const keys = shuffle(Object.keys(data)).slice(0, 2)

    return keys.map((key) => {
      const route = data[key]
      return {
        key,
        route,
      }
    })
  }, [data])

  return (
    <View className="mt-4">
      {isLoading ? (
        <View className="mt-5 flex h-12 items-center justify-center">
          <PlatformActivityIndicator />
        </View>
      ) : (
        arr.map((item) => (
          <RecommendationListItem
            key={item.key}
            data={item.route as RSSHubRouteDeclaration}
            routePrefix={item.key}
          />
        ))
      )}
    </View>
  )
}

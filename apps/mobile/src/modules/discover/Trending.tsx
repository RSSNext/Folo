import { cn } from "@follow/utils"
import { useQuery } from "@tanstack/react-query"
import { Text, View } from "react-native"

import { PlatformActivityIndicator } from "@/src/components/ui/loading/PlatformActivityIndicator"

import { fetchFeedTrending } from "./api"
import { TrendingFeedCard } from "./TrendingFeedCard"

export const Trending = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["trending", "feeds"],
    queryFn: () =>
      fetchFeedTrending({
        limit: 20,
      }).then((res) => res.data),
  })

  return (
    <View className="mt-4">
      {isLoading ? (
        <View className="mt-5 flex h-12 items-center justify-center">
          <PlatformActivityIndicator />
        </View>
      ) : (
        data?.map((item, index) => (
          <View key={item.feed?.id} className="relative">
            <TrendingFeedCard item={item} />
            <View className="pointer-events-none absolute inset-0 left-2 overflow-hidden rounded-xl">
              <Text
                className={cn(
                  "center absolute -left-5 -top-6 size-12 rounded-br-2xl pl-[26] pt-7 text-xs",
                  index < 3
                    ? cn(
                        "bg-accent text-white",
                        index === 0 && "bg-accent",
                        index === 1 && "bg-accent/90",
                        index === 2 && "bg-accent/80",
                      )
                    : "bg-gray-5/60",
                )}
              >
                {index + 1}
              </Text>
            </View>
          </View>
        ))
      )}
    </View>
  )
}

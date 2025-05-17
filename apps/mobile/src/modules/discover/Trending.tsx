import { cn } from "@follow/utils"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { Text, View } from "react-native"

import { PlatformActivityIndicator } from "@/src/components/ui/loading/PlatformActivityIndicator"

import { fetchFeedTrending } from "./api"
import { FeedSummary } from "./FeedSummary"

export const Trending = ({ className }: { className?: string }) => {
  const { i18n } = useTranslation()
  const { data, isLoading } = useQuery({
    queryKey: ["trending", "feeds"],
    queryFn: () =>
      fetchFeedTrending({
        lang: i18n.language.startsWith("zh") ? undefined : "eng",
        limit: 20,
      }).then((res) => res.data),
  })

  return (
    <View className={className}>
      {isLoading ? (
        <View className="mt-5 flex h-12 items-center justify-center">
          <PlatformActivityIndicator />
        </View>
      ) : (
        data?.map((item, index) => (
          <FeedSummary
            key={item.feed?.id}
            item={item}
            className="flex flex-1 flex-row items-center bg-none px-6 py-3"
            simple
            preChildren={
              <View
                className={cn(
                  "mr-4 flex size-6 items-center justify-center rounded-full",
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
                <Text className={cn("text-xs font-medium", index < 3 && "text-white")}>
                  {index + 1}
                </Text>
              </View>
            }
          />
        ))
      )}
    </View>
  )
}

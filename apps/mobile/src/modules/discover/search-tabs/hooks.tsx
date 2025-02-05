import { withOpacity } from "@follow/utils"
import { useMemo } from "react"
import { ActivityIndicator, Text, View } from "react-native"

import { SadCuteReIcon } from "@/src/icons/sad_cute_re"
import { useColor } from "@/src/theme/colors"

import { BaseSearchPageRootView } from "./__base"

export const useDataSkeleton = (isLoading: boolean, data: any) => {
  const textColor = useColor("text")
  return useMemo(() => {
    if (isLoading) {
      return (
        <BaseSearchPageRootView className="items-center justify-center">
          <View className="-mt-72" />

          <ActivityIndicator />
        </BaseSearchPageRootView>
      )
    }

    if (data?.data.length === 0) {
      return (
        <BaseSearchPageRootView className="items-center justify-center">
          <View className="-mt-72" />
          <SadCuteReIcon height={32} width={32} color={withOpacity(textColor, 0.5)} />
          <Text className="text-text/50 mt-2">No results found</Text>
        </BaseSearchPageRootView>
      )
    }

    return null
  }, [isLoading, data, textColor])
}

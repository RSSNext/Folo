import { withOpacity } from "@follow/utils"
import { useMemo } from "react"

import { PlatformActivityIndicator } from "@/src/components/ui/loading/PlatformActivityIndicator"
import { Text } from "@/src/components/ui/typography/Text"
import { SadCuteReIcon } from "@/src/icons/sad_cute_re"
import { useColor } from "@/src/theme/colors"

import { BaseSearchPageRootView } from "./__base"

export const useDataSkeleton = (isLoading: boolean, data: any) => {
  const textColor = useColor("text")
  return useMemo(() => {
    if (isLoading) {
      return (
        <BaseSearchPageRootView className="h-64 w-full items-center justify-center">
          <PlatformActivityIndicator />
        </BaseSearchPageRootView>
      )
    }
    if (data?.data.length === 0) {
      return (
        <BaseSearchPageRootView className="h-64 items-center justify-center">
          <SadCuteReIcon height={32} width={32} color={withOpacity(textColor, 0.5)} />
          <Text className="text-text/50 mt-2">No results found</Text>
        </BaseSearchPageRootView>
      )
    }
    return null
  }, [isLoading, data, textColor])
}

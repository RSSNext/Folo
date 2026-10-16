import { withOpacity } from "@follow/utils"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Pressable } from "react-native"

import { PlatformActivityIndicator } from "@/src/components/ui/loading/PlatformActivityIndicator"
import { Text } from "@/src/components/ui/typography/Text"
import { SadCuteReIcon } from "@/src/icons/sad_cute_re"
import { getFetchErrorMessage } from "@/src/lib/error-parser"
import { useColor } from "@/src/theme/colors"

import { BaseSearchPageRootView } from "./__base"

export const useDataSkeleton = (isLoading: boolean, itemCount: number | undefined) => {
  const { t } = useTranslation("common")
  const textColor = useColor("text")
  return useMemo(() => {
    if (isLoading) {
      return (
        <BaseSearchPageRootView className="h-64 w-full items-center justify-center">
          <PlatformActivityIndicator />
        </BaseSearchPageRootView>
      )
    }
    if (itemCount === 0) {
      return (
        <BaseSearchPageRootView className="h-64 items-center justify-center">
          <SadCuteReIcon height={32} width={32} color={withOpacity(textColor, 0.5)} />
          <Text className="mt-2 text-text/50">{t("search.empty.no_results")}</Text>
        </BaseSearchPageRootView>
      )
    }
    return null
  }, [isLoading, itemCount, t, textColor])
}

export const SearchErrorView = ({ error, onRetry }: { error: Error; onRetry: () => void }) => {
  const { t } = useTranslation("common")
  const textColor = useColor("text")
  return (
    <BaseSearchPageRootView className="h-64 items-center justify-center px-6">
      <SadCuteReIcon height={32} width={32} color={withOpacity(textColor, 0.5)} />
      <Text className="mt-2 text-center text-text/50">{getFetchErrorMessage(error)}</Text>
      <Pressable
        accessibilityRole="button"
        className="mt-4 rounded-full bg-secondary-system-fill px-4 py-2"
        onPress={onRetry}
      >
        <Text className="font-medium text-accent">{t("retry")}</Text>
      </Pressable>
    </BaseSearchPageRootView>
  )
}

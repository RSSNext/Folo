import { use } from "react"
import { useTranslation } from "react-i18next"
import { View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { NavigationBlurEffectHeaderView } from "@/src/components/layouts/views/SafeNavigationScrollView"
import { useDefaultHeaderHeight } from "@/src/hooks/useDefaultHeaderHeight"
import { ScreenItemContext } from "@/src/lib/navigation/ScreenItemContext"
import type { NavigationControllerView } from "@/src/lib/navigation/types"
import { RecommendationTab } from "@/src/modules/discover/Recommendations"

export const RecommendationCategoryScreen: NavigationControllerView<{
  category: string
}> = ({ category }) => {
  const { t } = useTranslation("common")
  const { reAnimatedScrollY } = use(ScreenItemContext)!
  const defaultHeaderHeight = useDefaultHeaderHeight()
  const insets = useSafeAreaInsets()
  return (
    <View className="flex-1">
      <NavigationBlurEffectHeaderView
        title={t(`discover.category.${category}` as any)}
        headerTitleAbsolute={false}
      />

      <RecommendationTab
        isSelected
        insets={{ top: defaultHeaderHeight }}
        reanimatedScrollY={reAnimatedScrollY}
        contentContainerStyle={{
          paddingTop: defaultHeaderHeight,
          paddingBottom: insets.bottom,
        }}
        tab={{
          name: t(`discover.category.${category}` as any),
          value: category,
        }}
      />
    </View>
  )
}

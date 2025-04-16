import { useContext } from "react"
import { useTranslation } from "react-i18next"
import { View } from "react-native"

import { NavigationBlurEffectHeaderView } from "@/src/components/layouts/views/SafeNavigationScrollView"
import { useDefaultHeaderHeight } from "@/src/hooks/useDefaultHeaderHeight"
import { ScreenItemContext } from "@/src/lib/navigation/ScreenItemContext"
import type { NavigationControllerView } from "@/src/lib/navigation/types"
import { RecommendationTab } from "@/src/modules/discover/Recommendations"

export const RecommendationCategoryScreen: NavigationControllerView<{
  category: string
}> = ({ category }) => {
  const { t } = useTranslation("common")
  const { reAnimatedScrollY } = useContext(ScreenItemContext)!
  const defaultHeaderHeight = useDefaultHeaderHeight()
  return (
    <View className="flex-1">
      <NavigationBlurEffectHeaderView
        title={t(`discover.category.${category}` as any)}
        headerTitleAbsolute={false}
      />

      <RecommendationTab
        isSelected
        reanimatedScrollY={reAnimatedScrollY}
        contentContainerStyle={{
          paddingTop: defaultHeaderHeight,
        }}
        tab={{
          name: t(`discover.category.${category}` as any),
          value: category,
        }}
      />
    </View>
  )
}

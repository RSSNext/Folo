import { useTranslation } from "react-i18next"
import { Text, View } from "react-native"

import { Search3CuteReIcon } from "@/src/icons/search_3_cute_re"
import { accentColor } from "@/src/theme/colors"

import { Trending } from "../discover/Trending"
import { OnboardingSectionScreenContainer } from "./shared"

export const StepInterests = () => {
  const { t } = useTranslation()

  return (
    <OnboardingSectionScreenContainer>
      <View className="flex items-center gap-4">
        <Search3CuteReIcon height={80} width={80} color={accentColor} />
        <Text className="text-text mt-2 text-2xl font-bold">{t("onboarding.interests_title")}</Text>
        <Text className="text-label mb-8 px-6 text-center text-lg">
          {t("onboarding.interests_description")}
        </Text>
      </View>

      <Trending className="mb-4 w-full" />
    </OnboardingSectionScreenContainer>
  )
}

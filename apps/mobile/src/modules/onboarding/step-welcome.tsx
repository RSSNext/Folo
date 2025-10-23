import { useTranslation } from "react-i18next"
import { View } from "react-native"

import { Logo } from "@/src/components/ui/logo"
import { Text } from "@/src/components/ui/typography/Text"

export const StepWelcome = () => {
  const { t } = useTranslation()
  return (
    <View className="flex-1 items-center justify-center">
      <Logo width={80} height={80} />
      <Text className="my-4 text-3xl font-bold text-text">{t("onboarding.welcome_title")}</Text>
      <Text className="mb-8 px-6 text-center text-lg text-label">
        {t("onboarding.welcome_guide")}
      </Text>
    </View>
  )
}

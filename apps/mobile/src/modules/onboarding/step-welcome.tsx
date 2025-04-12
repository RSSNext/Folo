import { useTranslation } from "react-i18next"
import { Text, View } from "react-native"

import { Logo } from "@/src/components/ui/logo"

export const StepWelcome = () => {
  const { t } = useTranslation()
  return (
    <View className="flex-1 items-center justify-center">
      <Logo width={80} height={80} />
      <Text className="text-text my-4 text-3xl font-bold">{t("onboarding.welcome_title")}</Text>
      <Text className="text-label mb-8 px-6 text-center text-lg">
        {t("onboarding.welcome_guide")}
      </Text>
    </View>
  )
}

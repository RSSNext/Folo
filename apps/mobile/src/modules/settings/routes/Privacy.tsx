import { useTranslation } from "react-i18next"

import {
  NavigationBlurEffectHeader,
  SafeNavigationScrollView,
} from "@/src/components/layouts/views/SafeNavigationScrollView"
import {
  GroupedInsetListCard,
  GroupedInsetListNavigationLink,
} from "@/src/components/ui/grouped/GroupedList"
import { useNavigation } from "@/src/lib/navigation/hooks"
import { TermsScreen } from "@/src/screens/(headless)/terms"

export const PrivacyScreen = () => {
  const { t } = useTranslation("settings")
  const { pushControllerView } = useNavigation()
  return (
    <SafeNavigationScrollView className="bg-system-grouped-background">
      <NavigationBlurEffectHeader title={t("titles.privacy")} />
      <GroupedInsetListCard className="mt-4">
        <GroupedInsetListNavigationLink
          label={t("privacy.terms")}
          onPress={() => {
            pushControllerView(TermsScreen)
          }}
        />
      </GroupedInsetListCard>
    </SafeNavigationScrollView>
  )
}

import { useTranslation } from "react-i18next"

import {
  NavigationBlurEffectHeaderView,
  SafeNavigationScrollView,
} from "@/src/components/layouts/views/SafeNavigationScrollView"
import {
  GroupedInsetListCard,
  GroupedInsetListNavigationLink,
} from "@/src/components/ui/grouped/GroupedList"
import { useNavigation } from "@/src/lib/navigation/hooks"
import { PrivacyPolicyScreen } from "@/src/screens/(headless)/PrivacyPolicyScreen"
import { TermsScreen } from "@/src/screens/(headless)/TermsScreen"

export const PrivacyScreen = () => {
  const { t } = useTranslation("settings")
  const { pushControllerView } = useNavigation()
  return (
    <SafeNavigationScrollView
      className="bg-system-grouped-background"
      Header={<NavigationBlurEffectHeaderView title={t("titles.privacy")} />}
    >
      <GroupedInsetListCard className="mt-4">
        <GroupedInsetListNavigationLink
          label={t("privacy.terms")}
          onPress={() => {
            pushControllerView(TermsScreen)
          }}
        />
        <GroupedInsetListNavigationLink
          label={t("privacy.privacy")}
          onPress={() => {
            pushControllerView(PrivacyPolicyScreen)
          }}
        />
      </GroupedInsetListCard>
    </SafeNavigationScrollView>
  )
}

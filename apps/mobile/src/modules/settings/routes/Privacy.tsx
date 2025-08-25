import { useTranslation } from "react-i18next"
import { Linking } from "react-native"

import {
  NavigationBlurEffectHeaderView,
  SafeNavigationScrollView,
} from "@/src/components/layouts/views/SafeNavigationScrollView"
import {
  GroupedInsetListCard,
  GroupedInsetListNavigationLink,
} from "@/src/components/ui/grouped/GroupedList"

export const PrivacyScreen = () => {
  const { t } = useTranslation("settings")
  return (
    <SafeNavigationScrollView
      className="bg-system-grouped-background"
      Header={<NavigationBlurEffectHeaderView title={t("titles.privacy")} />}
    >
      <GroupedInsetListCard className="mt-4">
        <GroupedInsetListNavigationLink
          label={t("privacy.terms")}
          onPress={() => {
            Linking.openURL("https://folo.is/terms-of-service")
          }}
        />
        <GroupedInsetListNavigationLink
          label={t("privacy.privacy")}
          onPress={() => {
            Linking.openURL("https://folo.is/privacy-policy")
          }}
        />
      </GroupedInsetListCard>
    </SafeNavigationScrollView>
  )
}

import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"

import {
  NavigationBlurEffectHeaderView,
  SafeNavigationScrollView,
} from "@/src/components/layouts/views/SafeNavigationScrollView"

/**
 * The follow screen while its feed or list loads, fails to load or is missing. It keeps the
 * header and its close button, as Android opens the screen full screen with no sheet to swipe.
 */
export const FollowStateView = ({ children }: { children: ReactNode }) => {
  const { t } = useTranslation("common")
  return (
    <SafeNavigationScrollView
      className="bg-system-grouped-background"
      contentContainerClassName="grow"
      Header={<NavigationBlurEffectHeaderView title={t("words.follow")} />}
    >
      {children}
    </SafeNavigationScrollView>
  )
}

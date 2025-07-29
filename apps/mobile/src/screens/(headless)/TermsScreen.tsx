import { legalMarkdown } from "@follow/legal"
import { useMemo } from "react"

import {
  NavigationBlurEffectHeaderView,
  SafeNavigationScrollView,
} from "@/src/components/layouts/views/SafeNavigationScrollView"
import { renderMarkdown } from "@/src/lib/markdown"
import type { NavigationControllerView } from "@/src/lib/navigation/types"

export const TermsMarkdown = () => {
  return useMemo(() => renderMarkdown(legalMarkdown.tos), [])
}

export const TermsScreen: NavigationControllerView = () => {
  return (
    <SafeNavigationScrollView
      className="bg-system-background"
      contentInsetAdjustmentBehavior="never"
      contentContainerClassName="px-4"
      Header={<NavigationBlurEffectHeaderView title="Terms of Service" />}
    >
      <TermsMarkdown />
    </SafeNavigationScrollView>
  )
}

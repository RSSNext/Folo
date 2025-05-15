import { legalMarkdown } from "@follow/legal/dist/index"

import {
  NavigationBlurEffectHeaderView,
  SafeNavigationScrollView,
} from "@/src/components/layouts/views/SafeNavigationScrollView"
import { Markdown } from "@/src/components/ui/typography/Markdown"
import type { NavigationControllerView } from "@/src/lib/navigation/types"

export const TermsMarkdown = () => {
  return (
    <Markdown
      value={legalMarkdown.tos}
      webViewProps={{ scrollEnabled: false, matchContents: true }}
      style={{ padding: 16, flex: 1 }}
    />
  )
}

export const TermsScreen: NavigationControllerView = () => {
  return (
    <SafeNavigationScrollView
      className="bg-system-background"
      contentInsetAdjustmentBehavior="never"
      Header={<NavigationBlurEffectHeaderView title="Terms of Service" />}
    >
      <TermsMarkdown />
    </SafeNavigationScrollView>
  )
}

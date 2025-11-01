import { SettingPlan } from "~/modules/settings/tabs/plan"
import { SettingsTitle } from "~/modules/settings/title"
import { defineSettingPageData } from "~/modules/settings/utils"

const iconName = "i-mgc-power-outline"
const priority = (1000 << 1) + 17

export const loader = defineSettingPageData({
  icon: iconName,
  name: "titles.plan.short",
  title: "titles.plan.long",
  priority,
  hideIf: (ctx, serverConfigs) => ctx.isInMASReview || !serverConfigs?.PAYMENT_ENABLED,
})

export function Component() {
  return (
    <>
      <SettingsTitle />
      <SettingPlan />
    </>
  )
}

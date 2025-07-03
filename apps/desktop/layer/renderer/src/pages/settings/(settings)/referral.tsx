import { SettingReferral } from "~/modules/settings/tabs/referral"
import { SettingsTitle } from "~/modules/settings/title"
import { defineSettingPageData } from "~/modules/settings/utils"

const iconName = "i-mgc-love-cute-re"
const priority = (1000 << 2) + 40

export const loader = defineSettingPageData({
  icon: iconName,
  name: "titles.referral.short",
  title: "titles.referral.long",
  priority,
  hideIf: (ctx, serverConfigs) => ctx.isInMASReview || !serverConfigs?.REFERRAL_ENABLED,
})

export function Component() {
  return (
    <>
      <SettingsTitle />
      <SettingReferral />
    </>
  )
}

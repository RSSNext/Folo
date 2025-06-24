import { UserRole } from "@follow/constants"

import { SettingInvitations } from "~/modules/settings/tabs/invitations"
import { SettingsTitle } from "~/modules/settings/title"
import { defineSettingPageData, DisableWhy } from "~/modules/settings/utils"

const iconName = "i-mgc-love-cute-re"
const priority = (1000 << 3) + 20

export const loader = defineSettingPageData({
  icon: iconName,
  name: "titles.invitations",
  priority,
  disableIf: (ctx) => [
    ctx.role === UserRole.Free || ctx.role === UserRole.Trial,
    DisableWhy.NotActivation,
  ],
  hideIf: (_, serverConfigs) => !serverConfigs?.INVITATION_ENABLED,
})

export function Component() {
  return (
    <>
      <SettingsTitle />
      <SettingInvitations />
    </>
  )
}

import { UserRole } from "@follow/constants"

import { SettingNotifications } from "~/modules/settings/tabs/notifications"
import { SettingsTitle } from "~/modules/settings/title"
import { defineSettingPageData, DisableWhy } from "~/modules/settings/utils"

const iconName = "i-mgc-notification-cute-re"
const priority = (1000 << 1) + 50

export const loader = defineSettingPageData({
  icon: iconName,
  name: "titles.notifications",
  priority,
  disableIf: (ctx) => [ctx.role === UserRole.Trial, DisableWhy.NotActivation],
})

export function Component() {
  return (
    <>
      <SettingsTitle />
      <SettingNotifications />
    </>
  )
}

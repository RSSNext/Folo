import { UserRole } from "@follow/constants"

import { SettingLists } from "~/modules/settings/tabs/lists"
import { SettingsTitle } from "~/modules/settings/title"
import { defineSettingPageData, DisableWhy } from "~/modules/settings/utils"

const iconName = "i-mgc-rada-cute-re"
const priority = (1000 << 2) + 10

export const loader = defineSettingPageData({
  icon: iconName,
  name: "titles.lists",
  priority,
  disableIf: (ctx) => [
    ctx.role === UserRole.Free || ctx.role === UserRole.Trial,
    DisableWhy.NotActivation,
  ],
  hideIf: (ctx) => ctx.isInMASReview,
})

export function Component() {
  return (
    <>
      <SettingsTitle />
      <SettingLists />
    </>
  )
}

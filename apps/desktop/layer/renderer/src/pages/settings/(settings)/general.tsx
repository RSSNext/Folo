import { SettingGeneral } from "~/modules/settings/tabs/general"
import { SettingsTitle } from "~/modules/settings/title"
import { defineSettingPageData } from "~/modules/settings/utils"

const iconName = "i-mgc-settings-7-cute-re"
const priority = 1000 << 1

export const loader = defineSettingPageData({
  icon: iconName,
  name: "titles.general",
  priority,
})

export function Component() {
  return (
    <>
      <SettingsTitle />
      <SettingGeneral />
    </>
  )
}

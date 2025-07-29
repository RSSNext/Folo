import { SettingAppearance } from "~/modules/settings/tabs/appearance"
import { SettingsTitle } from "~/modules/settings/title"
import { defineSettingPageData } from "~/modules/settings/utils"

const iconName = "i-mgc-palette-cute-re"
const priority = (1000 << 1) + 10

export const loader = defineSettingPageData({
  icon: iconName,
  name: "titles.appearance",
  priority,
})

export function Component() {
  return (
    <>
      <SettingsTitle />
      <SettingAppearance />
    </>
  )
}

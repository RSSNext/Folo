import { SettingSpotlight } from "~/modules/settings/tabs/spotlight"
import { SettingsTitle } from "~/modules/settings/title"
import { defineSettingPageData } from "~/modules/settings/utils"

const iconName = "i-mgc-flashlight-cute-re"
const priority = (1000 << 1) + 20

// eslint-disable-next-line react-refresh/only-export-components
export const loader = defineSettingPageData({
  icon: iconName,
  name: "titles.spotlight",
  priority,
})

export function Component() {
  return (
    <>
      <SettingsTitle />
      <SettingSpotlight />
    </>
  )
}

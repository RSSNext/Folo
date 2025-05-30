import { SettingAbout } from "~/modules/settings/tabs/about"
import { SettingsTitle } from "~/modules/settings/title"
import { defineSettingPageData } from "~/modules/settings/utils"

export const loader = defineSettingPageData({
  icon: "i-mgc-information-cute-re",
  name: "titles.about",
  priority: 9999,
})
export const Component = () => (
  <>
    <SettingsTitle />
    <SettingAbout />
  </>
)

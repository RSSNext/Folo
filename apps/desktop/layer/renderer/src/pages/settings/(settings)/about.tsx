import { SettingAbout } from "~/modules/settings/tabs/about"
import { SettingsTitle } from "~/modules/settings/title"
import { defineSettingPageData } from "~/modules/settings/utils"

const priority = Number.MAX_SAFE_INTEGER
export const handle = defineSettingPageData({
  icon: "i-mgc-information-cute-re",
  name: "titles.about",
  priority,
})
export const Component = () => (
  <>
    <SettingsTitle />
    <SettingAbout />
  </>
)

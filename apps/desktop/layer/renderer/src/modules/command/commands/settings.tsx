import { useThemeAtomValue } from "@follow/hooks"
import { useTranslation } from "react-i18next"

import { useSetTheme } from "~/hooks/common"
import { useShowCustomizeToolbarModal } from "~/modules/customize-toolbar/modal"

import { useRegisterCommandEffect } from "../hooks/use-register-command"
import { COMMAND_ID } from "./id"

export const useRegisterSettingsCommands = () => {
  useCustomizeToolbarCommand()
  useRegisterThemeCommands()
}

const useCustomizeToolbarCommand = () => {
  const [t] = useTranslation("settings")
  const showModal = useShowCustomizeToolbarModal()
  useRegisterCommandEffect([
    {
      id: COMMAND_ID.settings.customizeToolbar,
      label: t("customizeToolbar.title"),
      category: "follow:settings",
      icon: <i className="i-mgc-settings-7-cute-re" />,
      run() {
        showModal()
      },
    },
  ])
}

const useRegisterThemeCommands = () => {
  const [t] = useTranslation("settings")
  const theme = useThemeAtomValue()
  const setTheme = useSetTheme()

  useRegisterCommandEffect([
    {
      id: COMMAND_ID.settings.changeThemeToAuto,
      label: `To ${t("appearance.theme.system")}`,
      category: "follow:settings",
      icon: <i className="i-mgc-settings-7-cute-re" />,
      when: theme !== "system",
      run() {
        setTheme("system")
      },
    },
    {
      id: COMMAND_ID.settings.changeThemeToDark,
      label: `To ${t("appearance.theme.dark")}`,
      category: "follow:settings",
      icon: <i className="i-mingcute-moon-line" />,
      when: theme !== "dark",
      run() {
        setTheme("dark")
      },
    },
    {
      id: COMMAND_ID.settings.changeThemeToLight,
      label: `To ${t("appearance.theme.light")}`,
      category: "follow:settings",
      icon: <i className="i-mingcute-sun-line" />,
      when: theme !== "light",
      run() {
        setTheme("light")
      },
    },
  ])
}

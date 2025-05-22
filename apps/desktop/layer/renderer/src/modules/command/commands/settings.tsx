import { useThemeAtomValue } from "@follow/hooks"
import { useTranslation } from "react-i18next"

import { useSetTheme } from "~/hooks/common"
import { useShowCustomizeToolbarModal } from "~/modules/customize-toolbar/modal"

import { useRegisterCommandEffect } from "../hooks/use-register-command"
import type { Command, CommandCategory } from "../types"
import { COMMAND_ID } from "./id"

export const useRegisterSettingsCommands = () => {
  useCustomizeToolbarCommand()
  useRegisterThemeCommands()
}

const category: CommandCategory = "category.settings"
const useCustomizeToolbarCommand = () => {
  const [t] = useTranslation("settings")
  const showModal = useShowCustomizeToolbarModal()
  useRegisterCommandEffect([
    {
      id: COMMAND_ID.settings.customizeToolbar,
      label: t("customizeToolbar.title"),
      category,
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
      category,
      icon: <i className="i-mgc-settings-7-cute-re" />,
      when: theme !== "system",
      run() {
        setTheme("system")
      },
    },
    {
      id: COMMAND_ID.settings.changeThemeToDark,
      label: `To ${t("appearance.theme.dark")}`,
      category,
      icon: <i className="i-mingcute-moon-line" />,
      when: theme !== "dark",
      run() {
        setTheme("dark")
      },
    },
    {
      id: COMMAND_ID.settings.changeThemeToLight,
      label: `To ${t("appearance.theme.light")}`,
      category,
      icon: <i className="i-mingcute-sun-line" />,
      when: theme !== "light",
      run() {
        setTheme("light")
      },
    },
  ])
}

export type CustomizeToolbarCommand = Command<{
  id: typeof COMMAND_ID.settings.customizeToolbar
  fn: () => void
}>

export type SettingsCommand = CustomizeToolbarCommand

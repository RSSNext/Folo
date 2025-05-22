import { useTranslation } from "react-i18next"

import { useShortcutsModal } from "~/modules/modal/shortcuts"

import { useRegisterCommandEffect } from "../hooks/use-register-command"
import type { Command, CommandCategory } from "../types"
import { COMMAND_ID } from "./id"

const category: CommandCategory = "category.global"
export const useRegisterGlobalCommands = () => {
  const showShortcuts = useShortcutsModal()
  const { t } = useTranslation("shortcuts")
  useRegisterCommandEffect([
    {
      id: COMMAND_ID.global.showShortcuts,
      label: t("command.global.show_shortcuts.title"),
      run: () => {
        showShortcuts()
      },
      category,
    },
  ])
}

export type ShowShortcutsCommand = Command<{
  id: typeof COMMAND_ID.global.showShortcuts
  fn: () => void
}>

export type GlobalCommand = ShowShortcutsCommand

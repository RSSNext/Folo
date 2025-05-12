import { useShortcutsModal } from "~/modules/modal/shortcuts"

import { useRegisterCommandEffect } from "../hooks/use-register-command"
import type { Command } from "../types"
import { COMMAND_ID } from "./id"

export const useRegisterGlobalCommands = () => {
  const showShortcuts = useShortcutsModal()

  useRegisterCommandEffect([
    {
      id: COMMAND_ID.global.showShortcuts,
      label: "Show shortcuts",
      run: () => {
        showShortcuts()
      },
    },
  ])
}

export type ShowShortcutsCommand = Command<{
  id: typeof COMMAND_ID.global.showShortcuts
  fn: () => void
}>

export type GlobalCommand = ShowShortcutsCommand

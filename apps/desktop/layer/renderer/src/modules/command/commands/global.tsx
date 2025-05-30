import { EventBus } from "@follow/utils/event-bus"
import { useTranslation } from "react-i18next"

import { useShortcutsModal } from "~/modules/modal/hooks/useShortcutsModal"

import { useRegisterCommandEffect } from "../hooks/use-register-command"
import type { Command, CommandCategory } from "../types"
import { COMMAND_ID } from "./id"

declare module "@follow/utils/event-bus" {
  interface EventBusMap {
    "global:toggle-corner-play": void
    "global:quick-add": void
  }
}

const category: CommandCategory = "category.global"
export const useRegisterGlobalCommands = () => {
  const showShortcuts = useShortcutsModal()
  const { t } = useTranslation("shortcuts")
  useRegisterCommandEffect([
    {
      id: COMMAND_ID.global.showShortcuts,
      label: {
        title: t("command.global.show_shortcuts.title"),
        description: t("command.global.show_shortcuts.description"),
      },
      run: () => {
        showShortcuts()
      },
      category,
    },
    {
      id: COMMAND_ID.global.toggleCornerPlay,
      label: {
        title: t("command.global.toggle_corner_play.title"),
        description: t("command.global.toggle_corner_play.description"),
      },
      run: () => {
        EventBus.dispatch("global:toggle-corner-play")
      },
      category,
    },
    {
      id: COMMAND_ID.global.quickAdd,
      label: {
        title: t("command.global.quick_add.title"),
        description: t("command.global.quick_add.description"),
      },
      run: () => {
        EventBus.dispatch("global:quick-add")
      },
      category,
    },
  ])
}

export type ShowShortcutsCommand = Command<{
  id: typeof COMMAND_ID.global.showShortcuts
  fn: () => void
}>

export type ToggleCornerPlayCommand = Command<{
  id: typeof COMMAND_ID.global.toggleCornerPlay
  fn: () => void
}>

export type QuickAddCommand = Command<{
  id: typeof COMMAND_ID.global.quickAdd
  fn: () => void
}>

export type GlobalCommand = ShowShortcutsCommand | ToggleCornerPlayCommand | QuickAddCommand

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
    "global:toggle-ai-chat": void
    "global:toggle-ai-chat-pinned": void
  }
}

const category: CommandCategory = "category.global"
export const useRegisterGlobalCommands = () => {
  const showShortcuts = useShortcutsModal()
  const { t } = useTranslation("shortcuts")

  const aiIcon = (props?: { isActive?: boolean }) => {
    return <i className={props?.isActive ? "i-mgc-comment-cute-fi" : "i-mgc-comment-cute-re"} />
  }
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
        EventBus.dispatch(COMMAND_ID.global.toggleCornerPlay)
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
        EventBus.dispatch(COMMAND_ID.global.quickAdd)
      },
      category,
    },

    {
      id: COMMAND_ID.global.toggleAIChat,
      label: {
        title: t("command.global.toggle_ai_chat.title"),
        description: t("command.global.toggle_ai_chat.description"),
      },
      run: () => {
        EventBus.dispatch(COMMAND_ID.global.toggleAIChat)
      },
      icon: aiIcon,
      category,
    },
    {
      id: COMMAND_ID.global.toggleAIChatPinned,
      label: {
        title: t("command.global.toggle_ai_chat_pinned.title"),
        description: t("command.global.toggle_ai_chat_pinned.description"),
      },
      run: () => {
        EventBus.dispatch(COMMAND_ID.global.toggleAIChatPinned)
      },
      icon: aiIcon,
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

export type ToggleAIChatCommand = Command<{
  id: typeof COMMAND_ID.global.toggleAIChat
  fn: (ctx?: { entryId?: string }) => void
}>

export type ToggleAIChatPinnedCommand = Command<{
  id: typeof COMMAND_ID.global.toggleAIChatPinned
  fn: (ctx?: { entryId?: string }) => void
}>

export type GlobalCommand =
  | ShowShortcutsCommand
  | ToggleCornerPlayCommand
  | QuickAddCommand
  | ToggleAIChatCommand
  | ToggleAIChatPinnedCommand

import { transformShortcut } from "@follow/utils/utils"
import { useMemo } from "react"

import { COMMAND_ID } from "../commands/id"
import type { CommandCategory, FollowCommandId } from "../types"
import { getCommand } from "./use-command"
import type { RegisterHotkeyOptions } from "./use-register-hotkey"
import { useCommandHotkey } from "./use-register-hotkey"

const defaultCommandShortcuts = {
  // Layout commands
  [COMMAND_ID.layout.toggleTimelineColumn]: transformShortcut("$mod+B, ["),
  [COMMAND_ID.layout.toggleWideMode]: transformShortcut("$mod+["),
  [COMMAND_ID.layout.toggleZenMode]: transformShortcut("$mod+Shift+Z"),

  // Subscription commands
  [COMMAND_ID.subscription.markAllAsRead]: transformShortcut("Shift+$mod+A"),
  [COMMAND_ID.subscription.nextSubscription]: "J, ArrowDown",
  [COMMAND_ID.subscription.openInBrowser]: "O",
  [COMMAND_ID.subscription.openSiteInBrowser]: transformShortcut("$mod+O"),
  [COMMAND_ID.subscription.previousSubscription]: "K, ArrowUp",
  [COMMAND_ID.subscription.switchTabToNext]: "Tab",
  [COMMAND_ID.subscription.switchTabToPrevious]: transformShortcut("Shift+Tab"),
  [COMMAND_ID.subscription.toggleFolderCollapse]: "Z",

  // Timeline commands
  [COMMAND_ID.timeline.refetch]: "R",
  [COMMAND_ID.timeline.switchToNext]: "J, ArrowDown",
  [COMMAND_ID.timeline.switchToPrevious]: "K, ArrowUp",
  [COMMAND_ID.timeline.unreadOnly]: "U",

  // Entry commands
  [COMMAND_ID.entry.copyLink]: transformShortcut("Shift+$mod+C"),
  [COMMAND_ID.entry.copyTitle]: transformShortcut("Shift+$mod+B"),
  [COMMAND_ID.entry.openInBrowser]: "B",
  [COMMAND_ID.entry.read]: "M",
  [COMMAND_ID.entry.share]: transformShortcut("$mod+Alt+S"),
  [COMMAND_ID.entry.star]: "S",
  [COMMAND_ID.entry.tip]: transformShortcut("Shift+$mod+T"),
  [COMMAND_ID.entry.tts]: transformShortcut("Shift+$mod+V"),

  // Entry render commands
  [COMMAND_ID.entryRender.nextEntry]: "L, ArrowRight",
  [COMMAND_ID.entryRender.previousEntry]: "H, ArrowLeft",
  [COMMAND_ID.entryRender.scrollDown]: "J, ArrowDown",
  [COMMAND_ID.entryRender.scrollUp]: "K, ArrowUp",

  // Global commands
  [COMMAND_ID.global.showShortcuts]: "?",
} as const

export const useCommandShortcutItems = () => {
  const commandShortcuts = useCommandShortcuts()

  return useMemo(() => {
    const groupedCommands = {} as Record<CommandCategory, FollowCommandId[]>
    for (const commandKey in commandShortcuts) {
      const command = getCommand(commandKey as FollowCommandId)

      if (!command) {
        continue
      }

      groupedCommands[command.category] ??= []
      groupedCommands[command.category].push(commandKey as FollowCommandId)
    }

    return groupedCommands
  }, [commandShortcuts])
}
export const allowCustomizeCommands = new Set<FollowCommandId>([
  COMMAND_ID.layout.toggleTimelineColumn,
  COMMAND_ID.layout.toggleWideMode,
  COMMAND_ID.layout.toggleZenMode,
])
export type BindingCommandId = keyof typeof defaultCommandShortcuts

// eslint-disable-next-line @eslint-react/hooks-extra/no-unnecessary-use-prefix, @eslint-react/hooks-extra/ensure-custom-hooks-using-other-hooks
const useCommandShortcut = (commandId: BindingCommandId): string => {
  const commandShortcut = defaultCommandShortcuts[commandId]

  return commandShortcut
}

export const useCommandShortcuts = () => {
  return defaultCommandShortcuts
}

export const useCommandBinding = <T extends BindingCommandId>({
  commandId,
  when = true,
  args,
}: Omit<RegisterHotkeyOptions<T>, "shortcut">) => {
  const commandShortcut = useCommandShortcut(commandId)

  return useCommandHotkey({
    shortcut: commandShortcut,
    commandId,
    when,
    args,
  })
}

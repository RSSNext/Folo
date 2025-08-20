import { getStorageNS } from "@follow/utils/ns"
import { transformShortcut } from "@follow/utils/utils"
import { useAtomValue, useSetAtom } from "jotai"
import { atomWithStorage, selectAtom } from "jotai/utils"
import { useCallback, useMemo } from "react"

import { COMMAND_ID } from "../commands/id"
import type { CommandCategory, FollowCommandId } from "../types"
import { getCommand } from "./use-command"
import type { RegisterHotkeyOptions } from "./use-register-hotkey"
import { useCommandHotkey } from "./use-register-hotkey"

export const defaultCommandShortcuts = {
  // Layout commands
  [COMMAND_ID.layout.toggleSubscriptionColumn]: transformShortcut("$mod+B"),
  [COMMAND_ID.layout.toggleWideMode]: transformShortcut("$mod+["),
  [COMMAND_ID.layout.toggleZenMode]: transformShortcut("Shift+$mod+Z"),

  // Subscription commands
  [COMMAND_ID.subscription.markAllAsRead]: transformShortcut("Shift+$mod+A"),
  [COMMAND_ID.subscription.openInBrowser]: "O",
  [COMMAND_ID.subscription.openSiteInBrowser]: transformShortcut("$mod+O"),
  [COMMAND_ID.subscription.previousSubscription]: "K, ArrowUp",
  [COMMAND_ID.subscription.nextSubscription]: "J, ArrowDown",
  [COMMAND_ID.subscription.switchTabToNext]: "Tab",
  [COMMAND_ID.subscription.switchTabToPrevious]: transformShortcut("Shift+Tab"),
  [COMMAND_ID.subscription.toggleFolderCollapse]: "Z",

  // Timeline commands
  [COMMAND_ID.timeline.refetch]: "R",
  [COMMAND_ID.timeline.unreadOnly]: "U",
  [COMMAND_ID.timeline.switchToPrevious]: "K, ArrowUp",
  [COMMAND_ID.timeline.switchToNext]: "J, ArrowDown",

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
  [COMMAND_ID.entryRender.scrollUp]: "K, ArrowUp",
  [COMMAND_ID.entryRender.scrollDown]: "J, ArrowDown",

  // Global commands
  [COMMAND_ID.global.toggleCornerPlay]: "Space",
  [COMMAND_ID.global.quickAdd]: transformShortcut("$mod+N"),
  [COMMAND_ID.global.showShortcuts]: "?",
  [COMMAND_ID.global.toggleAIChat]: transformShortcut("$mod+I"),
} as const

const overrideCommandShortcutsAtom = atomWithStorage<
  Partial<Record<AllowCustomizeCommandId, string>>
>(getStorageNS("command-shortcuts"), {}, undefined, {
  getOnInit: true,
})

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
export const allowCustomizeCommands = new Set([
  COMMAND_ID.layout.toggleSubscriptionColumn,
  COMMAND_ID.layout.toggleWideMode,
  COMMAND_ID.layout.toggleZenMode,

  COMMAND_ID.subscription.markAllAsRead,

  COMMAND_ID.subscription.openInBrowser,
  COMMAND_ID.subscription.openSiteInBrowser,

  COMMAND_ID.subscription.switchTabToNext,
  COMMAND_ID.subscription.switchTabToPrevious,
  COMMAND_ID.subscription.toggleFolderCollapse,

  COMMAND_ID.timeline.refetch,
  COMMAND_ID.timeline.unreadOnly,

  COMMAND_ID.entry.copyLink,
  COMMAND_ID.entry.copyTitle,
  COMMAND_ID.entry.openInBrowser,
  COMMAND_ID.entry.read,
  COMMAND_ID.entry.share,
  COMMAND_ID.entry.star,
  COMMAND_ID.entry.tip,
  COMMAND_ID.entry.tts,

  COMMAND_ID.global.toggleAIChat,
] as const)
type ExtractSetType<T extends Set<unknown>> = T extends Set<infer U> ? U : never
export type AllowCustomizeCommandId = ExtractSetType<typeof allowCustomizeCommands>
export type BindingCommandId = keyof typeof defaultCommandShortcuts

export const useCommandShortcut = (commandId: BindingCommandId): string => {
  return useAtomValue(
    useMemo(
      () =>
        selectAtom(overrideCommandShortcutsAtom, (v) => {
          return v[commandId] ?? defaultCommandShortcuts[commandId]
        }),
      [commandId],
    ),
  )
}

export const useSetCustomCommandShortcut = () => {
  const setOverrideCommandShortcuts = useSetAtom(overrideCommandShortcutsAtom)

  return useCallback(
    (commandId: AllowCustomizeCommandId, shortcut: string | null) => {
      setOverrideCommandShortcuts((prev) => {
        if (shortcut === null) {
          const { [commandId]: _, ...rest } = prev

          return rest
        }
        return { ...prev, [commandId]: shortcut }
      })
    },
    [setOverrideCommandShortcuts],
  )
}

/**
 *
 * @deprecated Use `useCommandShortcut` for more granular control
 */
export const useCommandShortcuts = () => {
  const overrideCommandShortcuts = useAtomValue(overrideCommandShortcutsAtom)

  return {
    ...defaultCommandShortcuts,
    ...overrideCommandShortcuts,
  }
}

export const useIsShortcutConflict = (
  shortcut: string,
  excludeCommandId?: AllowCustomizeCommandId,
) => {
  const overrideCommandShortcuts = useAtomValue(overrideCommandShortcutsAtom)

  return useMemo(() => {
    const allShortcuts = {
      ...defaultCommandShortcuts,
      ...overrideCommandShortcuts,
    }

    // Check if the shortcut conflicts with any existing shortcuts
    for (const [commandId, existingShortcut] of Object.entries(allShortcuts)) {
      // Skip the command we're excluding (useful when editing an existing shortcut)
      if (excludeCommandId && commandId === excludeCommandId) {
        continue
      }

      // Normalize shortcuts for comparison (handle multiple shortcuts separated by comma)
      const normalizedShortcut = shortcut.trim().toLowerCase()
      const normalizedExisting = existingShortcut.toLowerCase()

      // Check if shortcuts match exactly or if one is contained in the other's alternatives
      const shortcutAlternatives = normalizedShortcut.split(",").map((s) => s.trim())
      const existingAlternatives = normalizedExisting.split(",").map((s) => s.trim())

      for (const shortcutAlt of shortcutAlternatives) {
        for (const existingAlt of existingAlternatives) {
          if (shortcutAlt === existingAlt) {
            return {
              hasConflict: true,
              conflictingCommandId: commandId as FollowCommandId,
            }
          }
        }
      }
    }

    return {
      hasConflict: false,
      conflictingCommandId: null,
    }
  }, [shortcut, excludeCommandId, overrideCommandShortcuts])
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

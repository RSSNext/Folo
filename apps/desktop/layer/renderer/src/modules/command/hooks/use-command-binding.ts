import { shortcuts } from "~/constants/shortcuts"

import { COMMAND_ID } from "../commands/id"
import type { RegisterHotkeyOptions } from "./use-register-hotkey"
import { useCommandHotkey } from "./use-register-hotkey"

const defaultCommandShortcuts = {
  [COMMAND_ID.entry.read]: shortcuts.entry.toggleRead.key,
  [COMMAND_ID.entry.openInBrowser]: shortcuts.entry.openInBrowser.key,
  [COMMAND_ID.entry.star]: shortcuts.entry.toggleStarred.key,
  [COMMAND_ID.entry.copyLink]: shortcuts.entry.copyLink.key,
  [COMMAND_ID.entry.copyTitle]: shortcuts.entry.copyTitle.key,
  [COMMAND_ID.entry.tts]: shortcuts.entry.tts.key,
  [COMMAND_ID.entry.tip]: shortcuts.entry.tip.key,
  [COMMAND_ID.entry.share]: shortcuts.entry.share.key,

  [COMMAND_ID.entryRender.scrollUp]: shortcuts.entry.scrollUp.key,
  [COMMAND_ID.entryRender.scrollDown]: shortcuts.entry.scrollDown.key,

  [COMMAND_ID.timeline.switchToNext]: shortcuts.entries.next.key,
  [COMMAND_ID.timeline.switchToPrevious]: shortcuts.entries.previous.key,
  [COMMAND_ID.timeline.refetch]: shortcuts.entries.refetch.key,

  [COMMAND_ID.layout.toggleTimelineColumn]: shortcuts.layout.toggleSidebar.key,

  [COMMAND_ID.subscription.nextSubscription]: shortcuts.subscriptions.nextSubscription.key,
  [COMMAND_ID.subscription.previousSubscription]: shortcuts.subscriptions.previousSubscription.key,
  [COMMAND_ID.subscription.switchTabToNext]: shortcuts.subscriptions.switchNextView.key,
  [COMMAND_ID.subscription.switchTabToPrevious]: shortcuts.subscriptions.switchPreviousView.key,

  [COMMAND_ID.global.showShortcuts]: shortcuts.layout.showShortcuts.key,

  [COMMAND_ID.entryRender.nextEntry]: shortcuts.entry.nextEntry.key,
  [COMMAND_ID.entryRender.previousEntry]: shortcuts.entry.previousEntry.key,

  [COMMAND_ID.subscription.toggleFolderCollapse]: shortcuts.subscriptions.toggleFolderCollapse.key,
  [COMMAND_ID.subscription.markAllAsRead]: shortcuts.subscriptions.markAllAsRead.key,
  [COMMAND_ID.subscription.openInBrowser]: shortcuts.subscriptions.openInBrowser.key,
  [COMMAND_ID.subscription.openSiteInBrowser]: shortcuts.subscriptions.openSiteInBrowser.key,
} as const

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

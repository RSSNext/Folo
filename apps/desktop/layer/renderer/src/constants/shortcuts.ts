import { transformShortcut } from "@follow/utils/utils"

import { COPY_MAP } from "~/constants"

type Shortcuts = Record<
  string,
  Record<string, { name: I18nKeysForShortcuts; key: string; extra?: string }>
>

const shortcutConfigs = {
  subscriptions: {
    add: {
      name: tShortcuts("keys.subscriptions.add"),
      key: "Meta+T",
    },
    switchToView: {
      name: tShortcuts("keys.subscriptions.switchToView"),
      key: "1, 2, 3, 4, 5, 6",
    },
    switchNextView: {
      name: tShortcuts("keys.subscriptions.switchNextView"),
      key: "Tab, ArrowRight",
    },
    switchPreviousView: {
      name: tShortcuts("keys.subscriptions.switchPreviousView"),
      key: "Shift+Tab, ArrowLeft",
    },
    nextSubscription: {
      name: tShortcuts("keys.subscriptions.nextSubscription"),
      key: "J, ArrowDown",
    },
    previousSubscription: {
      name: tShortcuts("keys.subscriptions.previousSubscription"),
      key: "K, ArrowUp",
    },
    toggleFolderCollapse: {
      name: tShortcuts("keys.subscriptions.toggleFolderCollapse"),
      key: "Z",
    },
  },
  layout: {
    toggleSidebar: {
      name: tShortcuts("keys.layout.toggleSidebar"),
      key: "Meta+B, [",
    },
    showShortcuts: {
      name: tShortcuts("keys.layout.showShortcuts"),
      key: "H",
    },
    toggleWideMode: {
      name: tShortcuts("keys.layout.toggleWideMode"),
      key: "Meta+[",
    },
    zenMode: {
      name: tShortcuts("keys.layout.zenMode"),
      key: "Ctrl+Shift+Z",
    },
  },
  entries: {
    refetch: {
      name: tShortcuts("keys.entries.refetch"),
      key: "R",
    },
    previous: {
      name: tShortcuts("keys.entries.previous"),
      key: "K, ArrowUp",
    },
    next: {
      name: tShortcuts("keys.entries.next"),
      key: "J, ArrowDown",
    },
    markAllAsRead: {
      name: tShortcuts("keys.entries.markAllAsRead"),
      key: "Shift+Meta+A",
    },
    toggleUnreadOnly: {
      name: tShortcuts("keys.entries.toggleUnreadOnly"),
      key: "U",
    },
  },
  entry: {
    toggleRead: {
      name: tShortcuts("keys.entry.toggleRead"),
      key: "M",
    },
    toggleStarred: {
      name: tShortcuts("keys.entry.toggleStarred"),
      key: "S",
    },
    openInBrowser: {
      name: COPY_MAP.OpenInBrowser(),
      key: "B",
      extra: "Double Click",
    },
    tts: {
      name: tShortcuts("keys.entry.tts"),
      key: "Shift+Meta+V",
    },
    copyLink: {
      name: tShortcuts("keys.entry.copyLink"),
      key: "Shift+Meta+C",
    },
    copyTitle: {
      name: tShortcuts("keys.entry.copyTitle"),
      key: "Shift+Meta+B",
    },
    tip: {
      name: tShortcuts("keys.entry.tip"),
      key: "Shift+Meta+T",
    },
    share: {
      name: tShortcuts("keys.entry.share"),
      key: "Meta+Alt+S",
    },
    scrollUp: {
      name: tShortcuts("keys.entry.scrollUp"),
      key: "K, ArrowUp",
    },
    scrollDown: {
      name: tShortcuts("keys.entry.scrollDown"),
      key: "J, ArrowDown",
    },
    nextEntry: {
      name: tShortcuts("keys.entries.next"),
      key: "L, ArrowRight",
    },
    previousEntry: {
      name: tShortcuts("keys.entries.previous"),
      key: "H, ArrowLeft",
    },
  },
  audio: {
    "play/pause": {
      name: tShortcuts("keys.audio.playPause"),
      key: "Space",
    },
  },
  misc: {
    quickSearch: {
      name: tShortcuts("keys.misc.quickSearch"),
      key: "Meta+K",
    },
  },
} as const

function transformShortcuts<T extends Shortcuts>(configs: T) {
  const result = configs

  for (const category in configs) {
    for (const shortcutKey in configs[category]) {
      const config = configs[category][shortcutKey]
      result[category]![shortcutKey]!.key = transformShortcut(config!.key)
    }
  }

  return result
}

export const shortcuts = transformShortcuts(shortcutConfigs) satisfies Shortcuts

export const shortcutsType: { [key in keyof typeof shortcuts]: I18nKeysForShortcuts } = {
  subscriptions: "keys.type.subscriptions",
  layout: "keys.type.layout",
  entries: "keys.type.entries",
  entry: "keys.type.entry",
  audio: "keys.type.audio",
  misc: "keys.type.misc",
}

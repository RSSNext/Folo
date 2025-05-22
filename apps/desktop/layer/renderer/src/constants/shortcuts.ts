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
      key: "$mod+T",
    },
    switchToView: {
      name: tShortcuts("keys.subscriptions.switchToView"),
      key: "1, 2, 3, 4, 5, 6",
    },
    switchNextView: {
      name: tShortcuts("keys.subscriptions.switchNextView"),
      key: "Tab",
    },
    switchPreviousView: {
      name: tShortcuts("keys.subscriptions.switchPreviousView"),
      key: "Shift+Tab",
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
    openInBrowser: {
      name: tShortcuts("keys.subscriptions.openInBrowser"),
      key: "O",
    },
    openSiteInBrowser: {
      name: tShortcuts("keys.subscriptions.openSiteInBrowser"),
      key: "$mod+O",
    },
    markAllAsRead: {
      name: tShortcuts("keys.entries.markAllAsRead"),
      key: "Shift+$mod+A",
    },
  },
  layout: {
    toggleSidebar: {
      name: tShortcuts("keys.layout.toggleSidebar"),
      key: "$mod+B, [",
    },

    toggleWideMode: {
      name: tShortcuts("keys.layout.toggleWideMode"),
      key: "$mod+[",
    },
    toggleZenMode: {
      name: tShortcuts("keys.layout.zenMode"),
      key: "$mod+Shift+Z",
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
      key: "Shift+$mod+V",
    },
    copyLink: {
      name: tShortcuts("keys.entry.copyLink"),
      key: "Shift+$mod+C",
    },
    copyTitle: {
      name: tShortcuts("keys.entry.copyTitle"),
      key: "Shift+$mod+B",
    },
    tip: {
      name: tShortcuts("keys.entry.tip"),
      key: "Shift+$mod+T",
    },
    share: {
      name: tShortcuts("keys.entry.share"),
      key: "$mod+Alt+S",
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
      key: "$mod+K",
    },
    showShortcuts: {
      name: tShortcuts("keys.misc.showShortcuts"),
      key: "?",
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

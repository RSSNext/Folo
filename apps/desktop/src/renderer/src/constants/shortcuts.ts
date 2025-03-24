import { transformShortcut } from "@follow/utils/utils"

import { COPY_MAP } from "~/constants"

type Shortcuts = Record<
  string,
  Record<string, { name: I18nKeysForShortcuts; key: string; extra?: string }>
>

const shortcutConfigs = {
  feeds: {
    add: {
      name: "keys.feeds.add",
      key: "Meta+T",
    },
    switchToView: {
      name: "keys.feeds.switchToView",
      key: "1, 2, 3, 4, 5, 6",
    },
    switchBetweenViews: {
      name: "keys.feeds.switchBetweenViews",
      key: "Tab, Left, Right",
    },
  },
  layout: {
    toggleSidebar: {
      name: "keys.layout.toggleSidebar",
      key: "Meta+B, [",
    },
    showShortcuts: {
      name: "keys.layout.showShortcuts",
      key: "H",
    },
    toggleWideMode: {
      name: "keys.layout.toggleWideMode",
      key: "Meta+[",
    },
    zenMode: {
      name: "keys.layout.zenMode",
      key: "Ctrl+Shift+Z",
    },
  },
  entries: {
    refetch: {
      name: "keys.entries.refetch",
      key: "R",
    },
    previous: {
      name: "keys.entries.previous",
      key: "K, Up",
    },
    next: {
      name: "keys.entries.next",
      key: "J, Down",
    },
    markAllAsRead: {
      name: "keys.entries.markAllAsRead",
      key: "Shift+Meta+A",
    },
    toggleUnreadOnly: {
      name: "keys.entries.toggleUnreadOnly",
      key: "U",
    },
  },
  entry: {
    toggleRead: {
      name: "keys.entry.toggleRead",
      key: "M",
    },
    toggleStarred: {
      name: "keys.entry.toggleStarred",
      key: "S",
    },
    openInBrowser: {
      name: COPY_MAP.OpenInBrowser(),
      key: "B",
      extra: "Double Click",
    },
    tts: {
      name: "keys.entry.tts",
      key: "Shift+Meta+V",
    },
    copyLink: {
      name: "keys.entry.copyLink",
      key: "Shift+Meta+C",
    },
    copyTitle: {
      name: "keys.entry.copyTitle",
      key: "Shift+Meta+B",
    },
    tip: {
      name: "keys.entry.tip",
      key: "Shift+Meta+T",
    },
    share: {
      name: "keys.entry.share",
      key: "Meta+Alt+S",
    },
    scrollUp: {
      name: "keys.entry.scrollUp",
      key: "PageUp",
    },
    scrollDown: {
      name: "keys.entry.scrollDown",
      key: "PageDown",
    },
  },
  audio: {
    "play/pause": {
      name: "keys.audio.playPause",
      key: "Space",
    },
  },
  misc: {
    quickSearch: {
      name: "keys.misc.quickSearch",
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
  feeds: "keys.type.feeds",
  layout: "keys.type.layout",
  entries: "keys.type.entries",
  entry: "keys.type.entry",
  audio: "keys.type.audio",
  misc: "keys.type.misc",
}

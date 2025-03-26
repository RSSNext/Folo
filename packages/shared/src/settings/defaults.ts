import type { GeneralSettings, IntegrationSettings, UISettings } from "./interface"

export const defaultGeneralSettings: GeneralSettings = {
  // App
  appLaunchOnStartup: false,
  language: "en",
  actionLanguage: "default",

  // mobile app
  startupScreen: "timeline",
  // Data control
  dataPersist: true,
  sendAnonymousData: true,
  showQuickTimeline: true,

  autoGroup: true,

  // view
  unreadOnly: true,
  // mark unread
  scrollMarkUnread: true,
  hoverMarkUnread: true,
  renderMarkUnread: false,
  // UX
  groupByDate: true,
  autoExpandLongSocialMedia: false,

  // Secure
  jumpOutLinkWarn: true,
  // TTS
  voice: "en-US-AndrewMultilingualNeural",

  // Pro feature
  enhancedSettings: false,
}

export const defaultUISettings: UISettings = {
  // Sidebar
  entryColWidth: 356,
  feedColWidth: 256,
  hideExtraBadge: false,

  opaqueSidebar: false,
  sidebarShowUnreadCount: true,
  thumbnailRatio: "square",

  // Global UI
  uiTextSize: 16,
  // System
  showDockBadge: true,
  // Misc
  modalOverlay: true,
  modalDraggable: true,
  modalOpaque: true,
  reduceMotion: false,
  usePointerCursor: false,

  // Font
  uiFontFamily: "SN Pro",
  readerFontFamily: "inherit",
  contentFontSize: 16,
  dateFormat: "default",
  contentLineHeight: 1.75,
  // Content
  readerRenderInlineStyle: true,
  codeHighlightThemeLight: "github-light",
  codeHighlightThemeDark: "github-dark",
  guessCodeLanguage: true,
  hideRecentReader: false,
  customCSS: "",

  // View
  pictureViewMasonry: true,
  wideMode: false,

  // Action Order
  toolbarOrder: {
    main: [],
    more: [],
  },
}

export const defaultIntegrationSettings: IntegrationSettings = {
  // eagle
  enableEagle: true,

  // readwise
  enableReadwise: false,
  readwiseToken: "",

  // instapaper
  enableInstapaper: false,
  instapaperUsername: "",
  instapaperPassword: "",

  // obsidian
  enableObsidian: false,
  obsidianVaultPath: "",

  // outline
  enableOutline: false,
  outlineEndpoint: "",
  outlineToken: "",
  outlineCollection: "",

  // readeck
  enableReadeck: false,
  readeckEndpoint: "",
  readeckToken: "",
}

export const defaultSettings = {
  general: defaultGeneralSettings,
  ui: defaultUISettings,
  integration: defaultIntegrationSettings,
}

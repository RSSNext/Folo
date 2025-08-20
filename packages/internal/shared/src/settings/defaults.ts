import type { AISettings, GeneralSettings, IntegrationSettings, UISettings } from "./interface"

export const defaultGeneralSettings: GeneralSettings = {
  // App
  appLaunchOnStartup: false,
  language: "en",
  translation: false,
  translationMode: "bilingual",
  summary: true,
  actionLanguage: "default",

  // mobile app
  startupScreen: "timeline",

  sendAnonymousData: true,
  showQuickTimeline: true,

  // subscription
  autoGroup: true,
  hideAllReadSubscriptions: false,
  hidePrivateSubscriptionsInTimeline: false,

  // view
  unreadOnly: true,
  // mark unread
  scrollMarkUnread: true,
  hoverMarkUnread: true,
  renderMarkUnread: false,
  // timeline
  groupByDate: true,
  autoExpandLongSocialMedia: false,
  dimRead: false,

  // Secure
  jumpOutLinkWarn: true,
  // TTS
  voice: "en-US-AndrewMultilingualNeural",

  // Pro feature
  enhancedSettings: false,

  // @mobile
  openLinksInExternalApp: false,
}

export const defaultUISettings: UISettings = {
  accentColor: "orange",

  // Sidebar
  entryColWidth: 356,
  aiColWidth: 384,
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

  reduceMotion: false,
  usePointerCursor: false,

  // Font
  uiFontFamily: "system-ui",
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

  showUnreadCountViewAndSubscriptionMobile: false,
  showUnreadCountBadgeMobile: false,

  // Discover
  discoverLanguage: "all",
}

export const defaultIntegrationSettings: IntegrationSettings = {
  // eagle
  enableEagle: false,

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

  // cubox
  enableCubox: false,
  cuboxToken: "",
  enableCuboxAutoMemo: false,

  // zotero
  enableZotero: false,
  zoteroUserID: "",
  zoteroToken: "",

  // qbittorrent
  enableQBittorrent: false,
  qbittorrentHost: "",
  qbittorrentUsername: "",
  qbittorrentPassword: "",

  saveSummaryAsDescription: false,

  // custom actions
  enableCustomIntegration: false,
  customIntegration: [],

  // fetch preferences (Electron only)
  useBrowserFetch: true,
}

export const defaultAISettings: AISettings = {
  personalizePrompt: "",
  shortcuts: [],

  // MCP Services
  mcpEnabled: false,
  mcpServices: [],

  // Features
  autoScrollWhenStreaming: true,
}

export const defaultSettings = {
  general: defaultGeneralSettings,
  ui: defaultUISettings,
  integration: defaultIntegrationSettings,
  ai: defaultAISettings,
}

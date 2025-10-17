import type { AISettings, GeneralSettings, IntegrationSettings, UISettings } from "./interface"

export const DEFAULT_SUMMARIZE_TIMELINE_SHORTCUT_ID = "default-summarize-timeline"

export const DEFAULT_SUMMARIZE_TIMELINE_PROMPT = `Generate a concise timeline summary based on entries within the current timeline within 24 hours.
Recap the day in a casual, conversational tone instead of a rigid report.
Open with a few relaxed sentences or light bullets that call out standout topics or shifts.
Wrap up by casually noting any other interesting threads; if nothing else stands out, say so naturally.`

export const defaultGeneralSettings: GeneralSettings = {
  // App
  appLaunchOnStartup: false,
  language: "en",
  translation: false,
  translationMode: "bilingual",
  summary: true,
  actionLanguage: "default",

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
  pictureViewImageOnly: false,
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

  // Timeline tabs preset (excluding the first fixed tab)
  timelineTabs: {
    visible: [],
    hidden: [],
  },
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
  shortcuts: [
    {
      name: "Summarize",
      prompt: DEFAULT_SUMMARIZE_TIMELINE_PROMPT,
      enabled: true,
      displayTargets: ["list"],
      id: DEFAULT_SUMMARIZE_TIMELINE_SHORTCUT_ID,
    },
    {
      name: "Analyze",
      prompt:
        "Analyze this content, looking for bias, patterns, trends, connections. Consider the author, the source. Research to fact check, if it seems beneficial. Research the broader setting. Try and think about what someone would want to know here.\n\nIf no content has been provided, ask about the relevant subject matter.",
      enabled: true,
      displayTargets: ["entry"],
      id: "default-analyze",
    },
  ],

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

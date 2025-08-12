export interface GeneralSettings {
  appLaunchOnStartup: boolean
  language: string
  translation: boolean
  translationMode: "bilingual" | "translation-only"
  summary: boolean
  actionLanguage: string
  startupScreen: "subscription" | "timeline"
  sendAnonymousData: boolean
  unreadOnly: boolean
  scrollMarkUnread: boolean
  hoverMarkUnread: boolean
  renderMarkUnread: boolean
  groupByDate: boolean
  jumpOutLinkWarn: boolean
  dimRead: boolean
  // TTS
  voice: string

  // subscription
  autoGroup: boolean
  hideAllReadSubscriptions: boolean
  hidePrivateSubscriptionsInTimeline: boolean

  /**
   * Top timeline for mobile
   */
  showQuickTimeline: boolean
  /**
   * Auto expand long social media
   */
  autoExpandLongSocialMedia: boolean

  // Pro feature
  enhancedSettings: boolean

  // @mobile
  openLinksInExternalApp: boolean
}

export type AccentColor =
  | "orange"
  | "blue"
  | "green"
  | "purple"
  | "pink"
  | "red"
  | "yellow"
  | "gray"
export interface UISettings {
  accentColor: AccentColor
  entryColWidth: number
  aiColWidth: number
  feedColWidth: number
  opaqueSidebar: boolean
  sidebarShowUnreadCount: boolean
  hideExtraBadge: boolean
  thumbnailRatio: "square" | "original"
  uiTextSize: number
  showDockBadge: boolean
  modalOverlay: boolean
  modalDraggable: boolean
  reduceMotion: boolean
  usePointerCursor: boolean | null
  uiFontFamily: string
  readerFontFamily: string
  // Content
  readerRenderInlineStyle: boolean
  codeHighlightThemeLight: string
  codeHighlightThemeDark: string
  guessCodeLanguage: boolean
  hideRecentReader: boolean
  customCSS: string

  // view
  pictureViewMasonry: boolean
  wideMode: boolean
  contentFontSize: number
  dateFormat: string
  contentLineHeight: number

  // Action Order
  toolbarOrder: {
    main: (string | number)[]
    more: (string | number)[]
  }

  // @mobile
  showUnreadCountViewAndSubscriptionMobile: boolean
  showUnreadCountBadgeMobile: boolean

  // Discover
  discoverLanguage: "all" | "eng" | "cmn"
}

export interface IntegrationSettings {
  // eagle
  enableEagle: boolean

  // readwise
  enableReadwise: boolean
  readwiseToken: string

  // instapaper
  enableInstapaper: boolean
  instapaperUsername: string
  instapaperPassword: string

  // obsidian
  enableObsidian: boolean
  obsidianVaultPath: string

  // outline
  enableOutline: boolean
  outlineEndpoint: string
  outlineToken: string
  outlineCollection: string

  // readeck
  enableReadeck: boolean
  readeckEndpoint: string
  readeckToken: string

  // cubox
  enableCubox: boolean
  cuboxToken: string
  enableCuboxAutoMemo: boolean

  //zotero
  enableZotero: boolean
  zoteroUserID: string
  zoteroToken: string

  // qbittorrent
  enableQBittorrent: boolean
  qbittorrentHost: string
  qbittorrentUsername: string
  qbittorrentPassword: string

  saveSummaryAsDescription: boolean

  // custom actions
  enableCustomIntegration: boolean
  customIntegration: CustomIntegration[]

  // fetch preferences (Electron only)
  useBrowserFetch: boolean
}

export interface FetchTemplate {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  url: string
  headers: Record<string, string>
  body?: string
}

export interface URLSchemeTemplate {
  scheme: string // e.g., "obsidian://", "bear://", "drafts://action"
  // URL schemes use query parameters or path segments for data
}

export interface CustomIntegration {
  id: string
  name: string
  icon: string
  type?: "http" | "url-scheme" // Optional for backward compatibility
  fetchTemplate?: FetchTemplate // Keep optional for url-scheme integrations
  urlSchemeTemplate?: URLSchemeTemplate
  enabled: boolean
}

export interface AIShortcut {
  id: string
  name: string
  prompt: string
  enabled: boolean
  icon?: string
  hotkey?: string
}

export interface AISettings {
  personalizePrompt: string
  shortcuts: AIShortcut[]

  // Features
  autoScrollWhenStreaming: boolean
}

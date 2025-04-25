export interface GeneralSettings {
  appLaunchOnStartup: boolean
  language: string
  translation: boolean
  translationMode: "bilingual" | "translation-only"
  summary: boolean
  actionLanguage: string
  startupScreen: "subscription" | "timeline"
  dataPersist: boolean
  sendAnonymousData: boolean
  unreadOnly: boolean
  scrollMarkUnread: boolean
  hoverMarkUnread: boolean
  renderMarkUnread: boolean
  groupByDate: boolean
  jumpOutLinkWarn: boolean
  // TTS
  voice: string
  autoGroup: boolean
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

export interface UISettings {
  entryColWidth: number
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

  saveSummaryAsDescription: boolean
}

export interface UISettings {
  subscriptionShowUnreadCount: boolean
  hideExtraBadge: boolean
  thumbnailRatio: "square" | "original"

  // Content
  readerRenderInlineStyle: boolean
  codeHighlightThemeLight: string
  codeHighlightThemeDark: string
  guessCodeLanguage: boolean
  hideRecentReader: boolean
  customCSS: string

  // view

  pictureViewFilterNoImage: boolean
}

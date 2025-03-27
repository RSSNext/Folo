export interface GeneralSettings {
  language: string

  sendAnonymousData: boolean
  unreadOnly: boolean
  scrollMarkUnread: boolean

  renderMarkUnread: boolean
  groupByDate: boolean
  jumpOutLinkWarn: boolean
  // TTS
  voice: string
  autoGroup: boolean

  /**
   * Auto expand long social media
   */
  autoExpandLongSocialMedia: boolean

  summary: boolean
  translation: boolean
  actionLanguage: string
  openLinksInApp: boolean
}

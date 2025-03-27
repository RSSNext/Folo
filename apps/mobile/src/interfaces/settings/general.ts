export interface GeneralSettings {
  language: string

  summary: boolean
  translation: boolean
  actionLanguage: string

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

  openLinksInApp: boolean
}

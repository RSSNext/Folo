export interface GeneralSettings {
  language: string
  translationLanguage: string

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

  /**
   * Open YouTube/Bilibili videos in their respective apps rather than in-app browser
   */
  openVideoInApp: boolean
}

export enum TrackerMapper {
  Identify = 1000,
  UserLogin = 1001,
  UiRenderInit = 1002,
  AppInit = 1003,
  // Biz
  NavigateEntry = 2000,
  BoostSent = 2001,
  Integration = 2002,
  DailyReportModal = 2003,
  SwitchToMasonry = 2004,
  WideMode = 2005,
  EntryContentHeaderImageGalleryClick = 2006,
  SearchOpen = 2007,
  QuickAddFeed = 2008,
  PlayerOpenDuration = 2009,
  UpdateRestart = 2010,
  TipModalOpened = 2011,
  FeedClaimed = 2012,
  DailyRewardClaimed = 2013,
  TipSent = 2014,
  SubscribeModalOpened = 2015,

  // https://docs.google.com/spreadsheets/d/1XlUxTxiXWIQDHFYa2eoPBeuosR1t2h8VFIjXEOqmjhY/edit?gid=0#gid=0
  Register = 3000,
  OnBoarding = 3001,
  Subscribe = 3002,

  // AI
  AIChatMessageSent = 4000,
}

import type { OpenPanel } from "./op"

type Tracker = (name: string, properties?: Record<string, unknown>) => Promise<any>
class TrackManager {
  private trackFns: Tracker[] = []

  setTrackFn(fn: Tracker) {
    this.trackFns.push(fn)

    return () => {
      this.trackFns = this.trackFns.filter((t) => t !== fn)
    }
  }

  getTrackFn(): Tracker {
    if (this.trackFns.length === 0) {
      console.error("[Tracker warn]: Track function not set")
    }
    return (name, properties) => {
      return Promise.all(this.trackFns.map((fn) => fn(name, properties)))
    }
  }

  setOpenPanelTracker(tracker: OpenPanel["track"]) {
    this.trackFns.push((name, properties) => tracker(name, properties))
  }
}

export const trackManager = new TrackManager()
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

  // https://docs.google.com/spreadsheets/d/1XlUxTxiXWIQDHFYa2eoPBeuosR1t2h8VFIjXEOqmjhY/edit?gid=0#gid=0
  Register = 3000,
  OnBoarding = 3001,
  Subscribe = 3002,
  EntryRead = 3003,
  EntryAction = 3004,
  ViewAction = 3005,
}

const CodeToTrackerName = Object.fromEntries(
  Object.entries(TrackerMapper).map(([key, value]) => [value, key]),
) as Record<number, string>

export class TrackerPoints {
  // App
  identify(userId: string) {
    this.track(TrackerMapper.Identify, { userId })
  }

  appInit(props: {
    electron?: boolean
    rn?: boolean
    loading_time?: number
    using_indexed_db?: boolean
    data_hydrated_time?: number
    version?: string
  }) {
    this.track(TrackerMapper.AppInit, props)
  }

  userLogin(userId: string) {
    this.track(TrackerMapper.UserLogin, { userId })
  }

  /**
   * For desktop UI only
   */
  uiRenderInit(spentTime: number) {
    this.track(TrackerMapper.UiRenderInit, { time: spentTime })
  }

  navigateEntry(props: { feedId?: string; entryId?: string; timelineId?: string }) {
    this.track(TrackerMapper.NavigateEntry, props)
  }
  boostSent(props: { amount: string; feedId: string }) {
    this.track(TrackerMapper.BoostSent, props)
  }

  integration(props: { type: string; event: string }) {
    this.track(TrackerMapper.Integration, props)
  }

  dailyReportModal() {
    this.track(TrackerMapper.DailyReportModal)
  }

  switchToMasonry() {
    this.track(TrackerMapper.SwitchToMasonry)
  }

  wideMode(props: { mode: "wide" | "normal" }) {
    this.track(TrackerMapper.WideMode, props)
  }

  entryContentHeaderImageGalleryClick(props: { feedId?: string }) {
    this.track(TrackerMapper.EntryContentHeaderImageGalleryClick, props)
  }
  searchOpen() {
    this.track(TrackerMapper.SearchOpen)
  }

  quickAddFeed(props: { type: "url" | "search"; defaultView: number }) {
    this.track(TrackerMapper.QuickAddFeed, props)
  }
  playerOpenDuration(props: {
    duration: number
    status?: "playing" | "loading" | "paused"
    trigger?: "manual" | "beforeunload"
  }) {
    this.track(TrackerMapper.PlayerOpenDuration, props)
  }

  updateRestart(props: { type: "app" | "renderer" | "pwa" }) {
    this.track(TrackerMapper.UpdateRestart, props)
  }

  tipModalOpened(props: { entryId?: string }) {
    this.track(TrackerMapper.TipModalOpened, props)
  }

  feedClaimed(props: { feedId: string }) {
    this.track(TrackerMapper.FeedClaimed, props)
  }

  dailyRewardClaimed() {
    this.track(TrackerMapper.DailyRewardClaimed)
  }

  tipSent(props: { amount: string; entryId: string }) {
    this.track(TrackerMapper.TipSent, props)
  }

  register(props: { type: "email" | "social" }) {
    this.track(TrackerMapper.Register, props)
  }

  onBoarding(props: { step: number; done: boolean }) {
    this.track(TrackerMapper.OnBoarding, props)
  }

  subscribe(props: { feedId?: string; listId?: string; view?: number }) {
    this.track(TrackerMapper.Subscribe, props)
  }

  entryRead(props: { entryId: string }) {
    this.track(TrackerMapper.EntryRead, props)
  }

  entryAction(props: { entryId: string; action: string }) {
    this.track(TrackerMapper.EntryAction, props)
  }

  viewAction(props: { view: string; action: string }) {
    this.track(TrackerMapper.ViewAction, props)
  }

  private track(code: TrackerMapper, properties?: Record<string, unknown>) {
    if (code) {
      let name = CodeToTrackerName[code]
      if (name) {
        name = snakeCase(name)
        Reflect.apply(trackManager.getTrackFn(), null, [name, { ...properties, __code: code }])
      }
    }
  }
}
const snakeCase = (string: string) => {
  return string
    .replaceAll(/\W+/g, " ")
    .split(/ |\B(?=[A-Z])/)
    .map((word) => word.toLowerCase())
    .join("_")
}

export type AllTrackers = keyof TrackerPoints

import type { FirebaseAnalyticsTypes } from "@react-native-firebase/analytics"
import type { PostHog } from "posthog-js"

import { FirebaseAdapter, OpenPanelAdapter, PostHogAdapter } from "./adapters"
import { TrackerManager } from "./manager"
import type { OpenPanel } from "./op"

export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>

type IdentifyPayload = {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
  handle?: string | null
}

type Tracker = (code: number, properties?: Record<string, unknown>) => Promise<any>
class TrackManager extends TrackerManager {
  private trackFns: Tracker[] = []

  constructor() {
    super({
      enableBatchProcessing: false,
      enableErrorRetry: true,
      maxRetries: 2,
    })
  }

  setTrackFn(fn: Tracker) {
    this.trackFns.push(fn)

    return () => {
      this.trackFns = this.trackFns.filter((t) => t !== fn)
    }
  }

  getTrackFn(): Tracker {
    if (this.trackFns.length === 0 && this.getEnabledAdapters().length === 0) {
      console.error("[Tracker warn]: Track function not set")
    }
    return (code, properties) => {
      const legacyPromises = this.trackFns.map((fn) => fn(code, properties))
      const modernPromise = this.track(code as TrackerMapper, properties)
      return Promise.all([...legacyPromises, modernPromise])
    }
  }

  setOpenPanelTracker(op: Optional<OpenPanel, "setHeaders">) {
    const adapter = new OpenPanelAdapter({ instance: op })
    this.addAdapter(adapter)
  }

  setFirebaseTracker(
    tracker: Pick<FirebaseAnalyticsTypes.Module, "logEvent" | "setUserId" | "setUserProperties">,
  ) {
    const adapter = new FirebaseAdapter({ instance: tracker })
    this.addAdapter(adapter)
  }

  setPostHogTracker(posthog: PostHog) {
    const adapter = new PostHogAdapter({ instance: posthog })
    this.addAdapter(adapter)
  }
}

export const trackManager = new TrackManager()
export const improvedTrackManager = trackManager // Alias for backward compatibility

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
  EntryRead = 3003,
  EntryAction = 3004,
  ViewAction = 3005,
}

export const CodeToTrackerName = (code: number) => {
  const map = Object.fromEntries(
    Object.entries(TrackerMapper).map(([key, value]) => [value, key]),
  ) as Record<number, string>
  const name = map[code]
  if (name) {
    return snakeCase(name)
  } else {
    throw new Error(`Tracker name not found for code ${code}`)
  }
}

export class TrackerPoints {
  // App
  identify(props: IdentifyPayload) {
    this.manager.identify(props)
    this.track(TrackerMapper.Identify, props)
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

  userLogin(props: { type: "email" | "social" }) {
    this.track(TrackerMapper.UserLogin, props)
  }

  /**
   * For desktop UI only
   */
  uiRenderInit(spentTime: number) {
    this.track(TrackerMapper.UiRenderInit, { spent_time: spentTime })
  }

  navigateEntry(props: { feedId?: string; entryId?: string; timelineId?: string }) {
    this.track(TrackerMapper.NavigateEntry, props)
  }

  boostSent(props: { amount: string; feedId: string; transactionId: string }) {
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

  subscribeModalOpened(props: {
    feedId?: string
    listId?: string
    feedUrl?: string
    isError?: boolean
  }) {
    this.track(TrackerMapper.SubscribeModalOpened, props)
  }

  feedClaimed(props: { feedId: string }) {
    this.track(TrackerMapper.FeedClaimed, props)
  }

  dailyRewardClaimed() {
    this.track(TrackerMapper.DailyRewardClaimed)
  }

  tipSent(props: { amount: string; entryId: string; transactionId: string }) {
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
    trackManager.getTrackFn()(code, properties)
  }

  get manager() {
    return trackManager
  }
}

const snakeCase = (string: string) => {
  return string.replaceAll(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`).replace(/^_/, "")
}

export type AllTrackers = keyof TrackerPoints

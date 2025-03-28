import type { FirebaseAnalyticsTypes } from "@react-native-firebase/analytics"

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

  setOpenPanelTracker(op: Optional<OpenPanel, "setHeaders">) {
    this.trackFns.push((code, properties) => {
      const name = CodeToTrackerName(code)

      switch (code) {
        case TrackerMapper.Identify: {
          const payload = properties as IdentifyPayload
          return op.identify({
            profileId: payload.id,
            email: payload.email ?? undefined,
            avatar: payload.image ?? undefined,
            lastName: payload.name ?? undefined,
            properties: {
              handle: payload.handle,
              name: payload.name,
            },
          })
        }
        default: {
          return op.track(name, { ...properties, __code: code })
        }
      }
    })
  }

  setFirebaseTracker(
    tracker: Pick<FirebaseAnalyticsTypes.Module, "logEvent" | "setUserId" | "setUserProperties">,
  ) {
    this.trackFns.push((code, properties) => {
      switch (code) {
        case TrackerMapper.Identify: {
          const payload = properties as IdentifyPayload
          tracker?.setUserId(payload.id)
          tracker?.setUserProperties({
            email: payload.email ?? null,
            name: payload.name ?? null,
            image: payload.image ?? null,
            handle: payload.handle ?? null,
          })
          break
        }
        case TrackerMapper.OnBoarding: {
          if (properties?.step === 0) {
            tracker?.logEvent("tutorial_begin")
          } else if (properties?.done) {
            tracker?.logEvent("tutorial_complete")
          }
          break
        }
        case TrackerMapper.NavigateEntry: {
          tracker?.logEvent("select_content", {
            content_type: "entry",
            item_id: `${properties?.feedId}/${properties?.entryId}`,
          })
          break
        }
        case TrackerMapper.UserLogin: {
          tracker?.logEvent("login", {
            method: properties?.type as string,
          })
          break
        }
        case TrackerMapper.Register: {
          tracker?.logEvent("sign_up", {
            method: properties?.type as string,
          })
          break
        }
        case TrackerMapper.Subscribe: {
          let group_id
          if (properties?.listId) {
            group_id = `list/${properties.listId}/${properties.view}`
          } else if (properties?.feedId) {
            group_id = `feed/${properties.feedId}/${properties.view}`
          }
          if (group_id) {
            tracker?.logEvent("join_group", {
              group_id,
            })
          }
          break
        }
        case TrackerMapper.BoostSent: {
          tracker?.logEvent("purchase", {
            currency: "POWER",
            value: properties?.amount,
            items: `feed/${properties?.feedId}`,
            transaction_id: properties?.transactionId,
          })
          break
        }
        case TrackerMapper.DailyRewardClaimed: {
          tracker?.logEvent("earn_virtual_currency", {
            virtual_currency_name: "POWER",
          })
          break
        }
        case TrackerMapper.TipSent: {
          tracker?.logEvent("purchase", {
            currency: "POWER",
            value: properties?.amount,
            items: `entry/${properties?.entryId}`,
            transaction_id: properties?.transactionId,
          })
          break
        }
        default: {
          const name = CodeToTrackerName(code)
          tracker?.logEvent(name, properties)
        }
      }
      return Promise.resolve()
    })
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
    this.track(TrackerMapper.UiRenderInit, { time: spentTime })
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
    Reflect.apply(trackManager.getTrackFn(), null, [code, { ...properties }])
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

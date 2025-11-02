import type { AuthUser } from "@follow-app/client-sdk"

import { TrackerMapper } from "./enums"
import { trackManager } from "./track-manager"

export class TrackerPoints {
  // App
  identify(props: AuthUser) {
    this.manager.identify(props)
    this.track(TrackerMapper.Identify, {
      id: props.id,
      name: props.name,
      email: props.email,
      image: props.image,
      handle: props.handle,
    })
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

  integration(props: { type: string; event: string }) {
    this.track(TrackerMapper.Integration, props)
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

  register(props: { type: "email" | "social" }) {
    this.track(TrackerMapper.Register, props)
  }

  onBoarding(props: { step: number; done: boolean } | { stepV2: string; done: boolean }) {
    this.track(TrackerMapper.OnBoarding, props)
  }

  subscribe(props: { feedId?: string; listId?: string; view?: number }) {
    this.track(TrackerMapper.Subscribe, props)
  }

  aiChatMessageSent() {
    this.track(TrackerMapper.AIChatMessageSent)
  }

  private track(code: TrackerMapper, properties?: Record<string, unknown>) {
    trackManager.getTrackFn()(code, properties)
  }

  get manager() {
    return trackManager
  }
}

export type AllTrackers = keyof TrackerPoints

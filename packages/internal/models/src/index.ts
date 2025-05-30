import type { FeedModel, ListModelPoplutedFeeds, UserModel } from "./types"

export * from "./types"

/* eslint-disable @typescript-eslint/no-namespace */
export namespace Models {
  export interface TrendingList {
    id: string
    title?: Nullable<string>
    description?: Nullable<string>
    image?: Nullable<string>
    view: number
    fee: number
    timelineUpdatedAt: string
    ownerUserId?: Nullable<string>
    subscriberCount?: number
  }

  export interface TrendingAggregates {
    trendingFeeds: FeedModel[]
    trendingLists: ListModelPoplutedFeeds[]
    trendingEntries: TrendingEntry[]
    trendingUsers: UserModel[]
  }

  export interface TrendingEntry {
    id: string
    feedId: string
    title: string
    url: string
    content: string
    description: string
    guid: string
    author: string
    insertedAt: string
    publishedAt: string
    readCount: number
  }
}

import type { AppType, languageSchema, users } from "@follow/shared/hono"
import type { hc } from "hono/client"
import type { z } from "zod"

declare const _apiClient: ReturnType<typeof hc<AppType>>

export type UserModel = Omit<
  typeof users.$inferSelect,
  | "createdAt"
  | "updatedAt"
  | "email"
  | "emailVerified"
  | "twoFactorEnabled"
  | "isAnonymous"
  | "suspended"
> & {
  email?: string
}

export type ExtractBizResponse<T extends (...args: any[]) => any> = Exclude<
  Awaited<ReturnType<T>>,
  undefined
>

export type ActiveList = {
  id: string | number
  name: string
  view: number
}

export type TransactionModel = ExtractBizResponse<
  typeof _apiClient.wallets.transactions.$get
>["data"][number]

export type FeedModel = ExtractBizResponse<typeof _apiClient.feeds.$get>["data"]["feed"]

export type ListModel = Omit<ListModelPoplutedFeeds, "feeds">
export type ListModelPoplutedFeeds = ExtractBizResponse<
  typeof _apiClient.lists.$get
>["data"]["list"]

export type InboxModel = ExtractBizResponse<typeof _apiClient.inboxes.$get>["data"]

export type FeedOrListRespModel = FeedModel | ListModelPoplutedFeeds | InboxModel
export type FeedOrListModel = FeedModel | ListModel | InboxModel

export type EntryResponse = Exclude<
  Extract<ExtractBizResponse<typeof _apiClient.entries.$get>, { code: 0 }>["data"],
  undefined
>

export type EntriesResponse = Array<
  | Exclude<Awaited<ReturnType<typeof _apiClient.entries.$post>>["data"], undefined>
  | Exclude<Awaited<ReturnType<typeof _apiClient.entries.inbox.$post>>["data"], undefined>
>[number]

export type CombinedEntryModel = Omit<EntriesResponse[number], "feeds"> & {
  entries: {
    content?: string | null
  }
  inboxes?: InboxModel
  feeds?: EntriesResponse[number]["feeds"]
}
export type EntryModel = CombinedEntryModel["entries"]
export type EntryModelSimple = Exclude<
  ExtractBizResponse<typeof _apiClient.feeds.$get>["data"]["entries"],
  undefined
>[number]
export type DiscoverResponse = Array<
  Exclude<ExtractBizResponse<typeof _apiClient.discover.$post>["data"], undefined>[number]
>

export type ActionsResponse = Exclude<
  ExtractBizResponse<typeof _apiClient.actions.$get>["data"],
  undefined
>["rules"]

export type DataResponse<T> = {
  code: number
  data?: T
}

export type ActiveEntryId = Nullable<string>

export type SubscriptionModel = ExtractBizResponse<
  typeof _apiClient.subscriptions.$get
>["data"][number] & {
  unread?: number
}

export type FeedSubscriptionModel = Extract<SubscriptionModel, { feeds: any }>
export type ListSubscriptionModel = Extract<SubscriptionModel, { list: any }>

export type SupportedLanguages = z.infer<typeof languageSchema>

export type RecommendationItem = ExtractBizResponse<
  typeof _apiClient.discover.rsshub.$get
>["data"][string]

export type ActionOperation = "contains" | "not_contains" | "eq" | "not_eq" | "gt" | "lt" | "regex"
export type ActionEntryField = "all" | "title" | "content" | "author" | "url" | "order"
export type ActionFeedField =
  | "view"
  | "title"
  | "site_url"
  | "feed_url"
  | "category"
  | "entry_title"
  | "entry_content"
  | "entry_url"
  | "entry_author"
  | "entry_media_length"

export type MediaModel = Exclude<
  ExtractBizResponse<typeof _apiClient.entries.$get>["data"],
  undefined
>["entries"]["media"]

export type ActionModel = {
  name: string
  condition: {
    field?: ActionFeedField
    operator?: ActionOperation
    value?: string
  }[][]
  result: {
    disabled?: boolean
    translation?: boolean | string
    summary?: boolean
    readability?: boolean
    silence?: boolean
    block?: boolean
    sourceContent?: boolean
    newEntryNotification?: boolean
    rewriteRules?: {
      from: string
      to: string
    }[]
    blockRules?: {
      field?: ActionEntryField
      operator?: ActionOperation
      value?: string | number
    }[]
    webhooks?: string[]
  }
}

export type ActionsInput = ActionModel[]

export const TransactionTypes = ["mint", "purchase", "tip", "withdraw", "airdrop"] as const

export type WalletModel = ExtractBizResponse<typeof _apiClient.wallets.$get>["data"][number]

export type ServerConfigs = ExtractBizResponse<typeof _apiClient.status.configs.$get>["data"]

export type RSSHubModel = Omit<
  ExtractBizResponse<typeof _apiClient.rsshub.list.$get>["data"][number],
  "userCount"
> & {
  baseUrl?: string | null
  accessKey?: string | null
  userCount?: number
}

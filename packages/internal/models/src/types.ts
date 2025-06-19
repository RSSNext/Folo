import type { AppType, languageSchema, users } from "@follow/shared"
import type { hc } from "hono/client"
import type { z } from "zod"

declare const _apiClient: ReturnType<typeof hc<AppType>>
type OptionalKey<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type UserModel = OptionalKey<
  typeof users.$inferSelect,
  | "createdAt"
  | "updatedAt"
  | "email"
  | "emailVerified"
  | "twoFactorEnabled"
  | "isAnonymous"
  | "suspended"
  | "bio"
  | "website"
  | "socialLinks"
>

export type ExtractBizResponse<T extends (...args: any[]) => any> = Exclude<
  Awaited<ReturnType<T>>,
  undefined
>
export type ExtractHonoParams<T extends (...args: any[]) => any> = Parameters<T>[0]["json"]

export type ActiveList = {
  id: string | number
  name: string
  view: number
}

export type TransactionModel = ExtractBizResponse<
  typeof _apiClient.wallets.transactions.$get
>["data"][number]

export type FeedModel = ExtractBizResponse<typeof _apiClient.feeds.$get>["data"]["feed"]

export type FeedAnalyticsModel = ExtractBizResponse<
  typeof _apiClient.feeds.$get
>["data"]["analytics"]

export type ListAnalyticsModel = ExtractBizResponse<
  typeof _apiClient.lists.$get
>["data"]["analytics"]

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

export type ActionSettings = Exclude<EntriesResponse[number]["settings"], undefined>

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

type Nullable<T> = T | null | undefined
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
  | "entry_attachments_duration"

export type MediaModel = Exclude<
  ExtractBizResponse<typeof _apiClient.entries.$get>["data"],
  undefined
>["entries"]["media"]

type ActionRulesRes = Exclude<
  Exclude<ExtractBizResponse<typeof _apiClient.actions.$get>["data"], undefined>["rules"],
  undefined | null
>[number]

export type ActionFilterItem = Partial<
  Exclude<ActionRulesRes["condition"][number], { length: number }>
>
export type ActionFilterGroup = ActionFilterItem[]
export type ActionFilter = ActionFilterGroup[]

export type ActionModel = Omit<ActionRulesRes, "condition"> & {
  condition: ActionFilter
  index: number
}
export type ActionId = Exclude<keyof ActionModel["result"], "disabled" | "blockRules">
export type ActionRules = ActionModel[]

export type ActionConditionIndex = {
  ruleIndex: number
  groupIndex: number
  conditionIndex: number
}

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

type Optional<T> = {
  [K in keyof T]?: T[K]
}

export type EntryReadHistoriesModel = Optional<
  ExtractBizResponse<
    (typeof _apiClient.entries)["read-histories"][":id"]["$get"]
  >["data"]["entryReadHistories"]
> & {
  entryId: string
}

export type BizRespose<T> = {
  data: T
  code: 0
}

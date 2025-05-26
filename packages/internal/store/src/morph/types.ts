/* eslint-disable @typescript-eslint/no-namespace */
import type { AuthSession } from "@follow/shared/src/hono"

// Add ExtractData type utility
type ExtractData<T extends (...args: any) => any> =
  Awaited<ReturnType<T>> extends { data?: infer D } ? D : never

export namespace HonoApiClient {
  export type Subscription_Get = ExtractData<typeof apiClient.subscriptions.$get>
  export type List_Get = ExtractData<typeof apiClient.lists.$get>
  export type Entry_Post = ExtractData<typeof apiClient.entries.$post>
  export type Entry_Inbox_Post = ExtractData<typeof apiClient.entries.inbox.$post>
  export type Entry_Get = ExtractData<typeof apiClient.entries.$get>
  export type Entry_Inbox_Get = ExtractData<typeof apiClient.entries.inbox.$get>
  export type List_List_Get = ExtractData<typeof apiClient.lists.list.$get>[number]
  export type Feed_Get = ExtractData<typeof apiClient.feeds.$get>
  export type User_Get = Exclude<AuthSession, null>["user"]

  export type ActionRule = Exclude<
    ExtractData<typeof apiClient.actions.$get>["rules"],
    undefined | null
  >[number]
  export type ActionSettings = Exclude<Entry_Post[number]["settings"], undefined>
}

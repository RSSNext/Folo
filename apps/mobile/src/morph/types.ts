/* eslint-disable @typescript-eslint/no-namespace */
import type { apiClient } from "../lib/api-fetch"

// Add ExtractData type utility
type ExtractData<T extends (...args: any) => any> =
  Awaited<ReturnType<T>> extends { data?: infer D } ? D : never

export namespace HonoApiClient {
  export type Subscription_Get = ExtractData<typeof apiClient.subscriptions.$get>
  export type List_Get = ExtractData<typeof apiClient.lists.$get>
  export type Entry_Post = ExtractData<typeof apiClient.entries.$post>
  export type Entry_Get = ExtractData<typeof apiClient.entries.$get>
  export type List_List_Get = ExtractData<typeof apiClient.lists.list.$get>[number]
  export type Feed_Get = ExtractData<typeof apiClient.feeds.$get>
}

/* eslint-disable @typescript-eslint/no-namespace */
import type { AuthSession } from "@follow/shared/hono"

import type { APIClient } from "../types"

// Add ExtractData type utility
type ExtractData<T extends (...args: any) => any> =
  Awaited<ReturnType<T>> extends { data?: infer D } ? D : never

export namespace HonoApiClient {
  export type Subscription_Get = ExtractData<APIClient["subscriptions"]["$get"]>
  export type List_Get = ExtractData<APIClient["lists"]["$get"]>
  export type Entry_Post = ExtractData<APIClient["entries"]["$post"]>
  export type Entry_Inbox_Post = ExtractData<APIClient["entries"]["inbox"]["$post"]>
  export type Entry_Get = ExtractData<APIClient["entries"]["$get"]>
  export type Entry_Inbox_Get = ExtractData<APIClient["entries"]["inbox"]["$get"]>
  export type List_List_Get = ExtractData<APIClient["lists"]["list"]["$get"]>[number]
  export type Feed_Get = ExtractData<APIClient["feeds"]["$get"]>
  export type User_Get = Exclude<AuthSession, null>["user"]

  export type ActionRule = Exclude<
    ExtractData<APIClient["actions"]["$get"]>["rules"],
    undefined | null
  >[number]
  export type ActionSettings = Exclude<Entry_Post[number]["settings"], undefined>
}

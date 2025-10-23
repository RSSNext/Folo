import { DEEPLINK_SCHEME } from "@follow/shared/constants"
import type { FollowClient } from "@follow-app/client-sdk"

import type { defineMetadata } from "../../src/meta-handler"

type Target = {
  id: string
  title?: Nullable<string>
  [key: string]: any
}
export const getPreferredTitle = (target?: Target | null) => {
  if (!target?.id) {
    return target?.title
  }

  return target.title
}

export const getHydrateData = (key: string) => {
  return window.__HYDRATE__?.[key]
}

// type ExtractHydrateData<T> = T extends readonly (infer Item)[]
//   ? Item extends { readonly type: "hydrate"; readonly data: infer D }
//     ? D
//     : never
//   : never

// export type GetHydrateData<T> = T extends (...args: any[]) => Promise<infer R>
//   ? ExtractHydrateData<R>
//   : T extends Promise<infer R>
//     ? ExtractHydrateData<R>
//     : ExtractHydrateData<T>

type ExtractHydrateData<T> = T extends readonly (infer Item)[]
  ? Item extends { readonly type: "hydrate"; readonly data: infer D }
    ? D
    : never
  : never

type UnwrapMetadataFn<T> =
  T extends <P extends Record<string, string>>(args: {
    params: P
    apiClient: FollowClient
    origin: string
    throwError: (status: number, message: any) => never
  }) => Promise<infer R> | infer R
    ? R
    : never

export type GetHydrateData<T> = T extends (...args: any[]) => Promise<infer R>
  ? ExtractHydrateData<R>
  : T extends (...args: any[]) => infer R
    ? ExtractHydrateData<R>
    : T extends Promise<infer R>
      ? ExtractHydrateData<R>
      : T extends typeof defineMetadata
        ? ExtractHydrateData<UnwrapMetadataFn<Parameters<T>[0]>>
        : ExtractHydrateData<T>

export const openInFollowApp = ({
  deeplink,
  fallback,
  fallbackUrl,
}: {
  deeplink: string
  fallback?: () => void
  fallbackUrl?: string
}): Promise<boolean> => {
  return new Promise((resolve) => {
    const timeout = 500
    let isAppOpened = false

    const handleBlur = () => {
      isAppOpened = true
      cleanup()
      resolve(true)
    }

    const cleanup = () => {
      window.removeEventListener("blur", handleBlur)
    }

    window.addEventListener("blur", handleBlur)

    const deeplinkUrl = `${DEEPLINK_SCHEME}${deeplink}`
    console.info("Open deeplink:", deeplinkUrl)
    window.location.href = deeplinkUrl

    setTimeout(() => {
      cleanup()
      if (!isAppOpened) {
        fallback?.()
        if (fallbackUrl) {
          window.location.href = fallbackUrl
        }
        resolve(false)
        return
      }
    }, timeout)
  })
}

import type { AuthClientError } from "@follow/utils/auth-error"
import { describeAuthError } from "@follow/utils/auth-error"
import { cn } from "@follow/utils/utils"
import { ExceptionCodeMap, FollowAPIError } from "@follow-app/client-sdk"
import { t } from "i18next"
import { FetchError } from "ofetch"
import { createElement } from "react"
import type { ExternalToast } from "sonner"
import { toast } from "sonner"

import { getApiUnreachable } from "~/atoms/api-connection"
import { getIsPaymentEnabled } from "~/atoms/server-configs"
import { CopyButton } from "~/components/ui/button/CopyButton"
import { Markdown } from "~/components/ui/markdown/Markdown"
import { DebugRegistry } from "~/modules/debug/registry"

// How fetch fails when no answer came back, offline or with the API down: each browser words it
// its own way, and a request the main process made for the window comes back as "fetch failed"
const CONNECTION_FAILURE_MESSAGE =
  /^(?:failed to fetch|load failed|networkerror when attempting to fetch resource\.?)$|\bfetch failed\b/iu

/** The request got no answer at all, so the browser's own wording would say nothing useful */
export const isConnectionFailure = (error: Error) =>
  !(error instanceof FollowAPIError) && CONNECTION_FAILURE_MESSAGE.test(error.message)

/**
 * The code of the server's answer, which the error locales translate. `code` names some errors
 * the SDK's own way, such as AUTH_REQUIRED for a refused session, whose server code is 1000, or
 * 1008 for a guest who has to sign in first.
 */
const getServerCode = (error: FollowAPIError) => {
  if (error.serverCode !== undefined) return error.serverCode
  const code = Number(error.code)
  return error.code && !Number.isNaN(code) ? code : undefined
}

/** What to tell the user about an error the auth client resolved with, translated where it can */
export const getAuthErrorMessage = (error: AuthClientError | null | undefined) =>
  describeAuthError(error, (key) => t(key, { ns: "common" }))

// i18next answers a missing key with the key without its namespace, such as "1000"
const translateErrorCode = (code: unknown, fallback: string) => {
  if (code == null) return fallback
  const translated: unknown = t(`errors:${code}` as never)
  return typeof translated === "string" && translated && translated !== `${code}`
    ? translated
    : fallback
}

export const getFetchErrorInfo = (
  error: Error,
): {
  message: string
  code?: number
} => {
  if (error instanceof FetchError) {
    try {
      const json = JSON.parse(error.response?._data)

      const { reason, code, message } = json
      const i18nMessage = translateErrorCode(code, message)
      return {
        message: `${i18nMessage}${reason ? `: ${reason}` : ""}`,
        code,
      }
    } catch {
      return { message: error.message }
    }
  }

  if (error instanceof FollowAPIError) {
    const { message } = error
    const code = getServerCode(error)
    if (code === undefined) return { message }
    try {
      return {
        message: translateErrorCode(code, message),
        code,
      }
    } catch {
      return { message }
    }
  }

  if (isConnectionFailure(error)) {
    return { message: t("common:app.api_unreachable") }
  }

  return { message: error.message }
}

export const getFetchErrorMessage = (error: Error) => {
  const { message } = getFetchErrorInfo(error)
  return message
}

/**
 * Just a wrapper around `toastFetchError` to create a function that can be used as a callback.
 */
export const createErrorToaster = (title?: string, toastOptions?: ExternalToast) => (err: Error) =>
  toastFetchError(err, { title, ...toastOptions })

export const toastFetchError = (
  error: Error,
  { title: _title, ..._toastOptions }: ExternalToast & { title?: string } = {},
) => {
  let message = ""
  // What the server said, kept next to the translation of its error code
  let serverMessage = ""
  let _reason = ""
  let code: number | undefined

  let status: number | undefined
  if (error instanceof FetchError) {
    try {
      status = error.statusCode ? Number(error.statusCode) : undefined
      const json =
        typeof error.response?._data === "string"
          ? JSON.parse(error.response?._data)
          : error.response?._data

      const { reason, code: _code, message: _message } = json
      code = _code
      message = _message
      serverMessage = typeof _message === "string" ? _message : ""

      const tValue = t(`errors:${code}` as any)
      const i18nMessage = tValue === code?.toString() ? message : tValue

      message = i18nMessage

      if (reason) {
        _reason = reason
      }
    } catch {
      message = error.message
    }
  }

  if (error instanceof FollowAPIError) {
    code = getServerCode(error)
    status = error.status ? Number(error.status) : undefined
    serverMessage = error.message
    try {
      message = translateErrorCode(code, error.message)
    } catch {
      message = error.message
    }
  } else if ("code" in error && error.code) {
    code = Number(error.code)
    try {
      const tValue = t(`errors:${code}` as any)
      const i18nMessage = tValue === code?.toString() ? error.message : tValue
      message = i18nMessage
    } catch {
      message = error.message
    }
  }

  // 2fa errors are handled by the form
  if (code === 4007 || code === 4008) {
    return
  }

  if (isConnectionFailure(error)) {
    // The notice of an unreachable server says the same and stays until it answers again
    if (!_title && getApiUnreachable()) return
    message = t("common:app.api_unreachable")
  }

  // Plain errors, such as wrapped auth client errors, carry their text in `message`
  if (!message && !(error instanceof FetchError)) {
    message = error.message
  }

  const toastOptions: ExternalToast = {
    ..._toastOptions,
    classNames: {
      toast: "items-start bg-theme-background",

      content: "w-full",
      ..._toastOptions.classNames,
    },
  }

  // Every request validation failure has this code; only the server's message names the field
  const detail =
    code === ExceptionCodeMap.UnprocessableContent && serverMessage !== message ? serverMessage : ""

  if (!_reason) {
    const title = _title || message || t("common:error_screen.unknown")
    toastOptions.description = _title ? detail || message : detail
    const isPaymentEnabled = getIsPaymentEnabled()
    const needUpgradeError = status && isPaymentEnabled ? status === 402 : false
    if (needUpgradeError) {
      toastOptions.description = t("request_error.upgrade_required")
    }
    return toast.error(title, {
      ...toastOptions,
      action: needUpgradeError
        ? {
            label: t("settings:subscription.actions.upgrade"),
            onClick: () => {
              window.router.showSettings({ tab: "plan" })
            },
          }
        : undefined,
    })
  } else {
    return toast.error(message || _title, {
      duration: 5000,
      ...toastOptions,
      description: createElement("div", {}, [
        createElement(CopyButton, {
          className: cn(
            "relative z-[1] float-end -mt-1",
            "border-transparent bg-theme-background text-text opacity-60 transition-opacity",
            "hover:bg-material-ultra-thick hover:opacity-100 focus:border-text-tertiary",
          ),
          key: "copy",
          value: _reason,
        }),
        createElement(Markdown, {
          key: "reason",
          className: "text-sm opacity-70 min-w-0 flex-1 mt-1",
          children: _reason,
        }),
      ]),
    })
  }
}
DebugRegistry.add("Simulate request error", () => {
  createErrorToaster(
    "Simulated request error",
    {},
  )({
    response: {
      _data: JSON.stringify({
        code: 1000,
        message: "Simulated request error",
        reason: "Simulated reason",
      }),
    },
  } as any)
})

DebugRegistry.add("Simulate payment need upgrade error", () => {
  createErrorToaster(
    "Simulated payment need upgrade error",
    {},
  )(
    new FollowAPIError("Simulated payment need upgrade error", 402, "1111", {
      reason: "Simulated reason",
    }),
  )
})

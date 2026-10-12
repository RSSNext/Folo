import { cn } from "@follow/utils/utils"
import { ExceptionCodeMap, FollowAPIError } from "@follow-app/client-sdk"
import { t } from "i18next"
import { FetchError } from "ofetch"
import { createElement } from "react"
import type { ExternalToast } from "sonner"
import { toast } from "sonner"

import { getIsPaymentEnabled } from "~/atoms/server-configs"
import { CopyButton } from "~/components/ui/button/CopyButton"
import { Markdown } from "~/components/ui/markdown/Markdown"
import { DebugRegistry } from "~/modules/debug/registry"

// The SDK appends the request and its arguments to the server's message
const stripRequestContext = (message: string) => message.replace(/\r?\nRequest:[\s\S]*$/u, "")

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
    const message = stripRequestContext(error.message)
    if (!error.code) return { message }
    // Codes such as "AUTH_REQUIRED" from the SDK are not API error codes
    const code = Number.isNaN(Number(error.code)) ? undefined : Number(error.code)
    try {
      const i18nMessage = translateErrorCode(code, message)
      return {
        message: i18nMessage,
        code,
      }
    } catch {
      return { message }
    }
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
    code = error.code ? Number(error.code) : undefined
    status = error.status ? Number(error.status) : undefined
    message = stripRequestContext(error.message)
    serverMessage = message
  }

  if ("code" in error && error.code) {
    code = Number(error.code)
    try {
      const tValue = t(`errors:${code}` as any)
      const i18nMessage = tValue === code?.toString() ? stripRequestContext(error.message) : tValue
      message = i18nMessage
    } catch {
      message = error.message
    }
  }

  // 2fa errors are handled by the form
  if (code === 4007 || code === 4008) {
    return
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

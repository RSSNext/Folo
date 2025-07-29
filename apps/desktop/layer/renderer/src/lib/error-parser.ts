import { DEV } from "@follow/shared/constants"
import { cn } from "@follow/utils/utils"
import { t } from "i18next"
import { FetchError } from "ofetch"
import { createElement } from "react"
import type { ExternalToast } from "sonner"
import { toast } from "sonner"

import { CopyButton } from "~/components/ui/button/CopyButton"
import { Markdown } from "~/components/ui/markdown/Markdown"
import { DebugRegistry } from "~/modules/debug/registry"

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
      const i18nKey = `errors:${code}` as any
      const i18nMessage = t(i18nKey) === i18nKey ? message : t(i18nKey)
      return {
        message: `${i18nMessage}${reason ? `: ${reason}` : ""}`,
        code,
      }
    } catch {
      return { message: error.message }
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
  let _reason = ""
  let code: number | undefined

  if (error instanceof FetchError) {
    try {
      const json =
        typeof error.response?._data === "string"
          ? JSON.parse(error.response?._data)
          : error.response?._data

      const { reason, code: _code, message: _message } = json
      code = _code
      message = _message

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

  // 2fa errors are handled by the form
  if (code === 4007 || code === 4008) {
    return
  }

  const toastOptions: ExternalToast = {
    ..._toastOptions,
    classNames: {
      toast: "items-start bg-theme-background",

      content: "w-full",
      ..._toastOptions.classNames,
    },
  }

  if (!_reason) {
    const title = _title || message
    toastOptions.description = _title ? message : undefined
    return toast.error(title, toastOptions)
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
if (DEV) {
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
}

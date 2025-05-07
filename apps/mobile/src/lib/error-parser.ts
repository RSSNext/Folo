import { t } from "i18next"
import { FetchError } from "ofetch"

import { toast } from "./toast"

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
export const createErrorToaster = (title?: string) => (err: Error) =>
  toastFetchError(err, { title })

export const toastFetchError = (error: Error, { title: _title }: { title?: string } = {}) => {
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

      const i18nMessage = message

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

  if (!_reason) {
    const title = _title || message
    return toast.error(title)
  } else {
    return toast.error(message || _title || "Unknown error")
  }
}

import { ExceptionCodeMap, FollowAPIError } from "@follow-app/client-sdk"
import { t } from "i18next"
import { FetchError } from "ofetch"

import { getIsPaymentEnabled } from "@/src/atoms/server-configs"
import { showUpgradeRequiredDialog } from "@/src/modules/dialogs/UpgradeRequiredDialog"

import { sanitizeErrorMessage } from "./error-message"
import { toast } from "./toast"

// expo/fetch rejects with "fetch failed: <native reason>" when no response came back, e.g.
// "java.net.ConnectException: Failed to connect to …", which means nothing to the user
const isConnectionFailure = (error: Error) =>
  error.message.startsWith("fetch failed:") && !error.message.includes("aborted")

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
        message: sanitizeErrorMessage(`${i18nMessage}${reason ? `: ${reason}` : ""}`),
        code,
      }
    } catch {
      return { message: sanitizeErrorMessage(error.message) }
    }
  }

  if (error instanceof FollowAPIError && error.code) {
    // Codes such as "AUTH_REQUIRED" from the SDK are not API error codes
    const code = Number.isNaN(Number(error.code)) ? undefined : Number(error.code)
    try {
      const i18nMessage = translateErrorCode(code, error.message)
      return {
        message: sanitizeErrorMessage(i18nMessage),
        code,
      }
    } catch {
      return { message: sanitizeErrorMessage(error.message) }
    }
  }

  if (isConnectionFailure(error)) {
    return { message: t("common:app.api_unreachable") }
  }

  return { message: sanitizeErrorMessage(error.message) }
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
  const fallbackMessage = isConnectionFailure(error)
    ? t("common:app.api_unreachable")
    : sanitizeErrorMessage(error.message)
  let message = fallbackMessage
  // What the server said, kept next to the translation of its error code
  let serverMessage = ""
  let _reason = ""
  let code: number | undefined
  let status: number | undefined

  if (error instanceof FetchError) {
    try {
      const resolvedStatus = error.statusCode ?? error.response?.status
      if (resolvedStatus != null) {
        status = Number(resolvedStatus)
      }
      const json =
        typeof error.response?._data === "string"
          ? JSON.parse(error.response?._data)
          : error.response?._data

      const { reason, code: _code, message: _message } = json
      if (_code != null) {
        code = typeof _code === "number" ? _code : Number(_code)
      }
      message = typeof _message === "string" && _message.trim() ? _message : message
      serverMessage = typeof _message === "string" ? _message : ""
      if (code != null) {
        const tValue = t(`errors:${code}` as any)
        if (tValue !== `${code}`) {
          message = tValue
        }
      }

      if (typeof reason === "string" && reason.trim()) {
        _reason = reason
      }
    } catch {
      message = fallbackMessage
    }
  }

  if (error instanceof FollowAPIError) {
    if (error.code) {
      code = Number(error.code)
    }
    status = error.status ? Number(error.status) : status
    serverMessage = error.message
    try {
      if (error.code) {
        const tValue = t(`errors:${code}` as any)
        const i18nMessage = tValue === code?.toString() ? error.message : tValue
        message = i18nMessage
      } else {
        message = fallbackMessage
      }
    } catch {
      message = fallbackMessage
    }
  }

  message = sanitizeErrorMessage(message)
  serverMessage = sanitizeErrorMessage(serverMessage)

  // 2fa errors are handled by the form
  if (code === 4007 || code === 4008) {
    return
  }

  const isPaymentFeatureEnabled = getIsPaymentEnabled()

  if (status === 402 && !isPaymentFeatureEnabled) {
    return toast.error(t("errors:1004"))
  }

  const needUpgradeError = status === 402 && isPaymentFeatureEnabled

  if (needUpgradeError) {
    showUpgradeRequiredDialog({
      title: message || t("settings:subscription.actions.upgrade"),
      message: t("settings:subscription.summary.free_description"),
    })
    return
  }

  // Every request validation failure has this code; only the server's message names the field
  const detail =
    code === ExceptionCodeMap.UnprocessableContent && serverMessage && serverMessage !== message
      ? serverMessage
      : ""

  if (!_reason) {
    const title = _title || message || "Unknown error"
    return detail ? toast.error(title, { description: detail }) : toast.error(title)
  } else {
    return toast.error(message || _title || "Unknown error")
  }
}

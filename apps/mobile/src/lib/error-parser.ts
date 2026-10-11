import { FollowAPIError } from "@follow-app/client-sdk"
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
        message: sanitizeErrorMessage(`${i18nMessage}${reason ? `: ${reason}` : ""}`),
        code,
      }
    } catch {
      return { message: sanitizeErrorMessage(error.message) }
    }
  }

  if (error instanceof FollowAPIError && error.code) {
    const code = Number(error.code)
    try {
      const i18nKey = `errors:${code}` as any
      const i18nMessage = t(i18nKey) === i18nKey ? error.message : t(i18nKey)
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

  if (!_reason) {
    const title = _title || message || "Unknown error"
    return toast.error(title)
  } else {
    return toast.error(message || _title || "Unknown error")
  }
}

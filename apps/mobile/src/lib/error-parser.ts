import type { AuthClientError } from "@follow/utils/auth-error"
import { describeAuthError } from "@follow/utils/auth-error"
import { ExceptionCodeMap, FollowAPIError, FollowTimeoutError } from "@follow-app/client-sdk"
import { t } from "i18next"
import { FetchError } from "ofetch"

import { getIsPaymentEnabled } from "@/src/atoms/server-configs"
import { showUpgradeRequiredDialog } from "@/src/modules/dialogs/UpgradeRequiredDialog"

import { isConnectionFailure } from "./network-error"
import { toast } from "./toast"

/**
 * The code of the server's answer, which the error locales translate. `code` names some errors
 * the SDK's own way, such as AUTH_REQUIRED for a refused session.
 */
const getServerCode = (error: FollowAPIError) => {
  if (error.serverCode !== undefined) return error.serverCode
  const code = Number(error.code)
  return error.code && !Number.isNaN(code) ? code : undefined
}

// A refused session asks to sign in, whether the server said 1008 (a guest's change) or 1000
// (no session): the translation of 1000 is a bare "Unauthorized" that says nothing to do.
const SIGN_IN_REQUIRED_MESSAGE_KEY = "errors:1008"
const SIGN_IN_REQUIRED_CODES = new Set<number | undefined>([
  ExceptionCodeMap.AuthError,
  ExceptionCodeMap.FakeUserReadOnly,
  // A 401 that is not the API's own answer
  undefined,
])
const isSignInRequired = (error: Error) =>
  error instanceof FollowAPIError &&
  error.status === 401 &&
  SIGN_IN_REQUIRED_CODES.has(getServerCode(error))

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

  if (isSignInRequired(error)) {
    return { message: t(SIGN_IN_REQUIRED_MESSAGE_KEY) }
  }

  // The server is reachable but answered too slowly; blaming the network would mislead
  if (error instanceof FollowTimeoutError) {
    return { message: t("common:app.request_timeout") }
  }

  if (error instanceof FollowAPIError) {
    const code = getServerCode(error)
    try {
      return {
        message: translateErrorCode(code, error.message),
        code,
      }
    } catch {
      return { message: error.message }
    }
  }

  if (isConnectionFailure(error)) {
    return { message: t("common:app.api_unreachable") }
  }

  return { message: error.message }
}

/** The server says what was asked for does not exist, so trying again cannot help */
export const isNotFoundError = (error: unknown) =>
  error instanceof FollowAPIError && error.status === 404

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
    : error.message
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
    code = getServerCode(error)
    status = error.status ? Number(error.status) : status
    serverMessage = error.message
    try {
      message = code === undefined ? fallbackMessage : translateErrorCode(code, error.message)
    } catch {
      message = fallbackMessage
    }

    if (isSignInRequired(error)) {
      message = t(SIGN_IN_REQUIRED_MESSAGE_KEY)
    } else if (error instanceof FollowTimeoutError) {
      message = t("common:app.request_timeout")
    }
  }

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
    // A title of the caller's own says what failed, so the server's answer still has to say why
    const description = _title && !detail && message !== _title ? message : detail
    return description ? toast.error(title, { description }) : toast.error(title)
  } else {
    return toast.error(message || _title || "Unknown error")
  }
}

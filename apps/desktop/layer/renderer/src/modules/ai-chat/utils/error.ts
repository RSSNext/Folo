import { ExceptionCodeMap } from "@follow-app/client-sdk"

import { getI18n } from "~/i18n"

export interface ParsedErrorData {
  code?: number
  remainedTokens?: number
  windowResetTime?: string
  [key: string]: any
}

export interface ParsedError {
  rawMessage: string
  errorCode: number | null
  errorData: ParsedErrorData | null
  isBusinessError: boolean
  isRateLimitError: boolean
}

/**
 * Parse error object or string to extract structured error information
 * @param error - Error object or error message string
 * @returns Parsed error information
 */
export function parseAIError(error: Error | string | undefined): ParsedError {
  if (!error) {
    return {
      rawMessage: "",
      errorCode: null,
      errorData: null,
      isBusinessError: false,
      isRateLimitError: false,
    }
  }

  const rawMessage = typeof error === "string" ? error : error.message

  try {
    const parsed = JSON.parse(rawMessage)
    const errorData: ParsedErrorData = parsed || {}
    const { code } = errorData

    const isRateLimitError = code === ExceptionCodeMap.AIRateLimitExceeded
    const isBusinessError = !!(code && ExceptionCodeMap[code])

    return {
      rawMessage,
      errorCode: code || null,
      errorData: isBusinessError ? errorData : null,
      isBusinessError,
      isRateLimitError,
    }
  } catch {
    // Not a JSON error, return as plain text error
    return {
      rawMessage,
      errorCode: null,
      errorData: null,
      isBusinessError: false,
      isRateLimitError: false,
    }
  }
}

/**
 * Check if an error is a rate limit error
 * @param error - Error object or error message string
 * @returns True if the error is a rate limit error
 */
export function isRateLimitError(error: Error | string | undefined): boolean {
  return parseAIError(error).isRateLimitError
}

/**
 * Get translated error message with fallback
 * @param error - Parsed error information
 * @returns User-friendly error message
 */
export function getErrorMessage(error: ParsedError): string {
  if (!error.isBusinessError || !error.errorCode) {
    return error.rawMessage
  }

  const errorKey = `errors:${error.errorCode}` as any
  const translatedMessage = getI18n().t(errorKey)

  // If translation exists and is different from the key, use it; otherwise fallback to raw message
  return translatedMessage !== errorKey ? translatedMessage : error.rawMessage
}

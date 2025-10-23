import { Spring } from "@follow/components/constants/spring.js"
import { cn } from "@follow/utils"
import { ExceptionCodeMap } from "@follow-app/client-sdk"
import { m } from "motion/react"
import * as React from "react"

import { getErrorMessage, parseAIError } from "~/modules/ai-chat/utils/error"

interface ErrorMessageProps {
  error: Error | string
  className?: string
}

/**
 * ErrorMessage component for displaying errors in the message list
 * Uses a subtle, message-like appearance with low-key colors
 * Note: Rate limit errors are handled separately by RateLimitNotice component
 */
export const ErrorMessage: React.FC<ErrorMessageProps> = ({ error, className }) => {
  const parsedError = React.useMemo(() => parseAIError(error), [error])

  if (parsedError.isRateLimitError) {
    return null
  }

  const displayMessage = getErrorMessage(parsedError)
  const { errorCode, errorData } = parsedError

  const getContextualInfo = () => {
    if (!parsedError.isBusinessError || !errorData) return null

    switch (errorCode) {
      default: {
        return null
      }
    }
  }

  const getErrorTitle = () => {
    if (parsedError.isBusinessError) {
      switch (errorCode) {
        case ExceptionCodeMap.AIRateLimitExceeded: {
          return "AI Rate Limit Exceeded"
        }
        default: {
          return "Error occurred"
        }
      }
    }
    return "Error occurred"
  }

  const contextualInfo = getContextualInfo()

  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={Spring.presets.smooth}
      className={cn("group mb-4 flex justify-start", className)}
    >
      <div className="relative flex max-w-full flex-col text-text">
        {/* Main error message bubble - similar to AI message style */}
        <div className="rounded-2xl border border-border bg-fill/50 px-4 py-3">
          <div className="flex flex-col gap-2">
            {/* Header with subtle icon */}
            <div className="flex items-center gap-2">
              <i className="i-mgc-information-cute-re size-4 text-text-tertiary" />
              <span className="text-xs font-medium text-text-secondary">{getErrorTitle()}</span>
            </div>

            {/* Error message - always visible but subtle */}
            <div className="cursor-text select-text text-sm leading-relaxed text-text-secondary">
              {displayMessage}
            </div>

            {/* Contextual info if exists */}
            {contextualInfo && (
              <div className="mt-1 space-y-1.5 rounded-lg border border-border/50 bg-fill-secondary/30 p-2.5">
                {contextualInfo}
              </div>
            )}
          </div>
        </div>
      </div>
    </m.div>
  )
}

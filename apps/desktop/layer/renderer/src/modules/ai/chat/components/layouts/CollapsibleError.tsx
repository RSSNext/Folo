import { Spring } from "@follow/components/constants/spring.js"
import { cn } from "@follow/utils"
import { ExceptionCodeMap } from "@follow-app/client-sdk"
import { m } from "motion/react"
import * as React from "react"

import { useI18n } from "~/hooks/common/useI18n"

interface CollapsibleErrorProps {
  error: Error | string
  title?: string
  className?: string
  collapsedHeight?: string
  icon?: string
}

interface ErrorData {
  code?: number
  remainedTokens?: number
  windowResetTime?: string
  [key: string]: any
}

export const CollapsibleError: React.FC<CollapsibleErrorProps> = ({
  error,
  title,
  className,
  collapsedHeight = "48px",
  icon = "i-mgc-alert-cute-fi",
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false)
  const t = useI18n()

  const { displayMessage, errorCode, errorData, isBusinessError } = React.useMemo(() => {
    const rawMessage = typeof error === "string" ? error : error.message

    try {
      const parsed = JSON.parse(rawMessage)

      const errorData: ErrorData = parsed || {}
      const { code } = errorData

      if (code && ExceptionCodeMap[code]) {
        // This is a business exception code
        const errorKey = `errors:${code}` as any
        const translatedMessage = t(errorKey)
        // If translation exists and is different from the key, use it; otherwise fallback to raw message
        const userFriendlyMessage = translatedMessage !== errorKey ? translatedMessage : rawMessage
        return {
          displayMessage: userFriendlyMessage,
          errorCode: code,
          errorData,
          isBusinessError: true,
        }
      }

      // If no code in data, return the original message
      return {
        displayMessage: rawMessage,
        errorCode: null,
        errorData: null,
        isBusinessError: false,
      }
    } catch {
      // If parsing fails, return the original message
      return {
        displayMessage: rawMessage,
        errorCode: null,
        errorData: null,
        isBusinessError: false,
      }
    }
  }, [error, t])

  const formatResetTime = (windowResetTime: string) => {
    const resetDate = new Date(windowResetTime)

    // Format date part as YYYY/MM/DD
    const dateFormatter = new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    const datePart = dateFormatter.format(resetDate).replaceAll("-", "/")

    // Format time part as HH:mm
    const timeFormatter = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
    const timePart = timeFormatter.format(resetDate)

    // Get timezone offset
    const timezoneFormatter = new Intl.DateTimeFormat("en", {
      timeZoneName: "short",
    })
    const timezone =
      timezoneFormatter.formatToParts(resetDate).find((part) => part.type === "timeZoneName")
        ?.value || ""

    return `${datePart} ${timePart} (${timezone})`
  }

  const getContextualInfo = () => {
    if (!isBusinessError || !errorData) return null

    switch (errorCode) {
      case ExceptionCodeMap.AIRateLimitExceeded: {
        // AI Rate Limit Exceeded
        return (
          <div className="space-y-2">
            {errorData.remainedTokens !== undefined && (
              <div className="flex justify-between text-xs">
                <span className="text-text-secondary">Remaining tokens:</span>
                <span className="font-medium">{errorData.remainedTokens}</span>
              </div>
            )}
            {errorData.windowResetTime && (
              <div className="flex justify-between text-xs">
                <span className="text-text-secondary">Rate limit resets at:</span>
                <span className="font-medium">{formatResetTime(errorData.windowResetTime)}</span>
              </div>
            )}
          </div>
        )
      }
      default: {
        return null
      }
    }
  }

  const getErrorTitle = () => {
    if (title) return title

    if (isBusinessError) {
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
    <div
      className={cn(
        "animate-in slide-in-from-bottom-2 fade-in-0 group mb-3 duration-300",
        className,
      )}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <m.div
        initial={false}
        animate={{
          height: isExpanded ? "auto" : collapsedHeight,
        }}
        transition={Spring.presets.snappy}
        className="overflow-hidden"
      >
        <div
          className={cn(
            "bg-red/5 border-red/20 shadow-red/5 dark:shadow-red/10 relative overflow-hidden rounded-xl backdrop-blur-2xl transition-all duration-200",
            "group-hover:bg-red/10 group-hover:border-red/30",
          )}
        >
          {/* Glass effect overlay */}
          <div className="from-red/5 absolute inset-0 bg-gradient-to-r to-transparent" />

          {/* Collapsed Content */}
          <div className="relative z-10 flex items-center gap-3 p-3">
            <m.div
              transition={{ duration: 0.2 }}
              className="bg-red/20 flex size-6 flex-shrink-0 items-center justify-center rounded-full"
            >
              <i className={cn(icon, "text-red size-3")} />
            </m.div>
            <div className="min-w-0 flex-1">
              <div className="text-red text-sm font-medium">{getErrorTitle()}</div>
            </div>
            <m.span
              animate={{
                opacity: isExpanded ? 0 : 1,
                scale: isExpanded ? 0.8 : 1,
              }}
              transition={{ duration: 0.15 }}
              className="text-text-tertiary text-xs"
            >
              hover to expand
            </m.span>
          </div>

          {/* Expanded Content */}
          <m.div
            animate={{
              opacity: isExpanded ? 1 : 0,
              height: isExpanded ? "auto" : 0,
            }}
            transition={{
              duration: 0.2,
              ease: "easeOut",
            }}
            className="overflow-hidden"
          >
            <div className="border-red/20 bg-red/5 border-t px-3 pb-3">
              <div className="text-red/80 bg-red/10 mt-2 rounded-md p-3 text-xs leading-relaxed">
                {displayMessage as string}
              </div>
              {contextualInfo && (
                <div className="bg-red/5 border-red/10 mt-3 rounded-md border p-3">
                  {contextualInfo}
                </div>
              )}
            </div>
          </m.div>
        </div>
      </m.div>
    </div>
  )
}

import { ScrollArea } from "@follow/components/ui/scroll-area/ScrollArea.js"
import { cn } from "@follow/utils"
import { ExceptionCodeMap } from "@follow-app/client-sdk"
import * as React from "react"

import { useI18n } from "~/hooks/common/useI18n"

interface CollapsibleErrorProps {
  error: Error | string
  title?: string
  className?: string
  collapsedHeight?: string
  icon?: string
  expandedMaxHeight?: string
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
  expandedMaxHeight = "240px",
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
        "group mb-3 duration-300 animate-in fade-in-0 slide-in-from-bottom-2",
        className,
      )}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div
        className={
          "relative overflow-hidden rounded-xl border-red/20 shadow-red/5 backdrop-blur-background transition-all duration-200 bg-mix-red-20 dark:shadow-red/10"
        }
      >
        {/* Collapsed Content */}
        <div
          className="relative z-10 flex items-center gap-3 p-3"
          style={{ minHeight: collapsedHeight }}
        >
          <div className="flex size-6 flex-shrink-0 items-center justify-center rounded-full bg-red/20 transition-colors duration-200">
            <i className={cn(icon, "size-3 text-red")} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-red">{getErrorTitle()}</div>
          </div>
          <span
            className={cn(
              "text-xs text-text-tertiary",
              "transition-[opacity,transform] duration-150 ease-in-out",
              "[@starting-style]:scale-100 [@starting-style]:opacity-100",
              isExpanded ? "scale-95 opacity-0" : "scale-100 opacity-100",
            )}
          >
            hover to expand
          </span>
        </div>

        {/* Expanded Content */}
        <div
          className={cn(
            "overflow-hidden [interpolate-size:allow-keywords] [transition-behavior:allow-discrete]",
            "transition-[height,opacity,display] duration-200 ease-in-out",
            "[@starting-style]:h-0 [@starting-style]:opacity-0",
            isExpanded ? "block h-[calc-size(auto)] opacity-100" : "hidden h-0 opacity-0",
          )}
          aria-hidden={!isExpanded}
          data-state={isExpanded ? "open" : "closed"}
        >
          <ScrollArea focusable={false} viewportProps={{ style: { maxHeight: expandedMaxHeight } }}>
            <div className="border-t border-red/20 bg-red/5 px-3 pb-3">
              <div className="mt-2 cursor-text select-text break-all rounded-md bg-red/10 p-3 text-xs leading-relaxed text-red/80">
                {displayMessage as string}
              </div>
              {contextualInfo && (
                <div className="mt-3 rounded-md border border-red/10 bg-red/5 p-3">
                  {contextualInfo}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}

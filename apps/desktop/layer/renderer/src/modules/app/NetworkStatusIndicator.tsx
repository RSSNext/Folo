import { Tooltip, TooltipContent, TooltipTrigger } from "@follow/components/ui/tooltip/index.jsx"
import { cn } from "@follow/utils/utils"

import { NetworkStatus, useApiStatus, useNetworkStatus } from "~/atoms/network"

export const NetworkStatusIndicator = () => {
  const networkStatus = useNetworkStatus()
  const apiStatus = useApiStatus()

  if (networkStatus === NetworkStatus.ONLINE && apiStatus === NetworkStatus.ONLINE) {
    return null
  }

  const isNetworkOffline = networkStatus === NetworkStatus.OFFLINE
  const isApiOffline = apiStatus === NetworkStatus.OFFLINE

  // Determine status type for styling
  const statusType = isNetworkOffline ? "offline" : isApiOffline ? "api-error" : "unknown"

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            "fixed bottom-3 left-3 flex items-center gap-2 rounded-full border backdrop-blur-md transition-all duration-200 hover:scale-105",
            "px-3 py-2 shadow-lg ring-1 ring-inset",
            // Default styling
            "border-fill bg-material-thick text-text-secondary",
            // Network offline - more severe styling
            statusType === "offline" && [
              "border-red/30 bg-red/10 text-red ring-red/20",
              "dark:border-red/40 dark:bg-red/15 dark:text-red dark:ring-red/25",

              ELECTRON && "!bg-sidebar",
            ],
            // API error - warning styling
            statusType === "api-error" && [
              "border-red/30 bg-red/10 text-red ring-red/20",
              "dark:border-red/40 dark:bg-red/15 dark:text-red dark:ring-red/25",
              ELECTRON && "!bg-sidebar",
            ],
            ELECTRON && "backdrop-blur-none",
          )}
        >
          <i
            className={cn(
              "size-4 shrink-0 transition-all duration-200",
              statusType === "offline" && "i-mgc-wifi-off-cute-re",
              statusType === "api-error" && "i-mgc-wifi-off-cute-re",
            )}
          />

          <span
            className={cn(
              "shrink-0 text-xs font-medium transition-colors duration-200",
              statusType === "offline" && "text-orange",
              statusType === "api-error" && "text-red",
            )}
          >
            {isNetworkOffline ? "Local Mode" : isApiOffline ? "API Error" : "Connection Issue"}
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent className="max-w-[40ch] text-sm" align="start" side="top" sideOffset={8}>
        <div className="space-y-1">
          <div className="font-medium">
            {isNetworkOffline
              ? "🔄 Local Mode Active"
              : isApiOffline
                ? "⚠️ API Connection Error"
                : "❌ Connection Problem"}
          </div>
          <div className="text-xs leading-relaxed text-text-secondary">
            {isNetworkOffline
              ? "Operating in local data mode due to network connection failure. Some features may be limited."
              : isApiOffline
                ? "Your network connection is stable, but our API servers are temporarily unreachable. Please try again later."
                : "There's an issue with the connection. Please check your network settings."}
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}

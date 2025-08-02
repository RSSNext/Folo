import { Tooltip, TooltipContent, TooltipTrigger } from "@follow/components/ui/tooltip/index.jsx"
import { cn } from "@follow/utils/utils"

import { NetworkStatus, useApiStatus, useNetworkStatus } from "~/atoms/network"

export const NetworkStatusIndicator = () => {
  const networkStatus = useNetworkStatus()
  const apiStatus = useApiStatus()

  if (networkStatus === NetworkStatus.ONLINE && apiStatus === NetworkStatus.ONLINE) {
    return null
  }
  const canAccessAnyData =
    networkStatus === NetworkStatus.ONLINE && apiStatus === NetworkStatus.ONLINE

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            "bg-background fixed bottom-2 left-2 flex items-center gap-1 rounded-full border px-1.5 py-1",
            !canAccessAnyData &&
              "border-current bg-red-50 text-red-400 dark:bg-red-800 dark:text-red-500",
          )}
        >
          <i className="i-mgc-wifi-off-cute-re shrink-0 text-base" />
          <span className="shrink-0 text-xs font-semibold opacity-50">
            {networkStatus === NetworkStatus.OFFLINE
              ? "Local Mode (alpha)"
              : apiStatus === NetworkStatus.OFFLINE
                ? "API Error"
                : ""}
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent className="max-w-[35ch]" align="start" side="top">
        {networkStatus === NetworkStatus.OFFLINE
          ? "Currently in Local data mode due to current network connection failure."
          : apiStatus === NetworkStatus.OFFLINE
            ? "Your network connection is normal, there may be an error on the remote server and the API interface is temporarily unreachable."
            : ""}
      </TooltipContent>
    </Tooltip>
  )
}

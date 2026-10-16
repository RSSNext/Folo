import { useUnreadAll } from "@follow/store/unread/hooks"
import { useEffect } from "react"

import { useUISettingKey } from "../atoms/settings/ui"
import { setBadgeCountAsyncWithPermission } from "../lib/permission"

// Unread counts change in bursts while syncing; only the settled value is written
const BADGE_UPDATE_DELAY = 500

export function useUnreadCountBadge() {
  const unreadCount = useUnreadAll()
  const showUnreadCountBadge = useUISettingKey("showUnreadCountBadgeMobile")
  useEffect(() => {
    if (!showUnreadCountBadge) return
    const timer = setTimeout(() => {
      setBadgeCountAsyncWithPermission(unreadCount).catch(console.error)
    }, BADGE_UPDATE_DELAY)
    return () => clearTimeout(timer)
  }, [unreadCount, showUnreadCountBadge])
}

import { useUnreadAll } from "@follow/store/unread/hooks"
import { useMutation } from "@tanstack/react-query"
import { useEffect } from "react"

import { setBadgeCountAsyncWithPermission } from "../lib/permission"

export function useUnreadCountBadge() {
  const unreadCount = useUnreadAll()
  const { mutate, isPending } = useMutation({
    mutationFn: (unread: number) => setBadgeCountAsyncWithPermission(unread),
  })
  useEffect(() => {
    if (!isPending) {
      mutate(unreadCount)
    }
  }, [unreadCount, mutate, isPending])
}

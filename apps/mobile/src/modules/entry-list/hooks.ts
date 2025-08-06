import { debouncedFetchEntryContentByStream } from "@follow/store/entry/store"
import { unreadSyncService } from "@follow/store/unread/store"
import type { ViewToken } from "@shopify/flash-list"
import { fetch as expoFetch } from "expo/fetch"
import { useCallback, useEffect, useInsertionEffect, useMemo, useRef, useState } from "react"
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native"

import { useGeneralSettingKey } from "@/src/atoms/settings/general"
import { getCookie } from "@/src/lib/auth"

const defaultIdExtractor = (item: ViewToken<string>) => item.key
export function useOnViewableItemsChanged({
  disabled,
  idExtractor = defaultIdExtractor,
  onScroll: onScrollProp,
}: {
  disabled?: boolean
  idExtractor?: (item: ViewToken<string>) => string
  onScroll?: (e: NativeSyntheticEvent<NativeScrollEvent>) => void
} = {}) {
  const orientation = useRef<"down" | "up">("down")
  const lastOffset = useRef(0)

  const markAsReadWhenScrolling = useGeneralSettingKey("scrollMarkUnread")
  const markAsReadWhenRendering = useGeneralSettingKey("renderMarkUnread")
  const [viewableItems, setViewableItems] = useState<ViewToken<string>[]>([])
  const [lastViewableItems, setLastViewableItems] = useState<ViewToken<string>[] | null>()
  const [lastRemovedItems, setLastRemovedItems] = useState<ViewToken<string>[] | null>(null)

  const [stableIdExtractor] = useState(() => idExtractor)

  const onViewableItemsChanged: (info: {
    viewableItems: ViewToken<string>[]
    changed: ViewToken<string>[]
  }) => void = useNonReactiveCallback(({ viewableItems, changed }) => {
    setViewableItems(viewableItems)

    debouncedFetchEntryContentByStream(
      viewableItems.map((item) => stableIdExtractor(item)),
      { cookie: getCookie(), fetch: expoFetch as any },
    )
    const removed = changed.filter((item) => !item.isViewable)

    // Only when the scroll direction is down and the current offset is a positive number, is it marked as read.
    // This can avoid misjudgment during the rebound of the pull-to-refresh (because the offset will change from negative to zero during the rebound).
    if (orientation.current === "down" && lastOffset.current > 0) {
      setLastViewableItems(viewableItems)
      if (removed.length > 0) {
        setLastRemovedItems((prev) => {
          if (prev) {
            return prev.concat(removed)
          } else {
            return removed
          }
        })
      }
    } else {
      setLastRemovedItems(null)
      setLastViewableItems(null)
    }
  })

  useEffect(() => {
    if (disabled) return

    if (markAsReadWhenScrolling && lastRemovedItems) {
      lastRemovedItems.forEach((item) => {
        unreadSyncService.markEntryAsRead(stableIdExtractor(item)).then(() => {
          setLastRemovedItems((prev) => {
            if (prev) {
              return prev.filter((prevItem) => prevItem.key !== item.key)
            } else {
              return null
            }
          })
        })
      })
    }

    if (markAsReadWhenRendering && lastViewableItems) {
      lastViewableItems.forEach((item) => {
        unreadSyncService.markEntryAsRead(stableIdExtractor(item))
      })
    }
  }, [
    disabled,
    lastRemovedItems,
    lastViewableItems,
    markAsReadWhenRendering,
    markAsReadWhenScrolling,
    stableIdExtractor,
  ])

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const currentOffset = e.nativeEvent.contentOffset.y
      const currentOrientation = currentOffset > lastOffset.current ? "down" : "up"
      orientation.current = currentOrientation
      lastOffset.current = currentOffset
      onScrollProp?.(e)
    },
    [onScrollProp],
  )

  return useMemo(
    () => ({ onViewableItemsChanged, onScroll, viewableItems }),
    [onScroll, onViewableItemsChanged, viewableItems],
  )
}

function useNonReactiveCallback<T extends (...args: any[]) => any>(fn: T): T {
  const ref = useRef(fn)
  useInsertionEffect(() => {
    ref.current = fn
  }, [fn])
  return useCallback(
    (...args: any) => {
      const latestFn = ref.current
      return latestFn(...args)
    },
    [ref],
  ) as unknown as T
}

import { debouncedFetchEntryContentByStream } from "@follow/store/entry/store"
import { unreadSyncService } from "@follow/store/unread/store"
import type { FlashList } from "@shopify/flash-list"
import type ViewToken from "@shopify/flash-list/dist/viewability/ViewToken"
import { fetch as expoFetch } from "expo/fetch"
import type { RefObject } from "react"
import { use, useCallback, useEffect, useInsertionEffect, useMemo, useRef, useState } from "react"
import type { NativeScrollEvent, NativeSyntheticEvent, ViewStyle } from "react-native"
import { useEventCallback } from "usehooks-ts"

import { useGeneralSettingKey } from "@/src/atoms/settings/general"
import { getCookie } from "@/src/lib/auth"
import { isAndroid } from "@/src/lib/platform"

import { PagerListVisibleContext, PagerListWillVisibleContext } from "../screen/PagerListContext"

const defaultIdExtractor = (item: ViewToken) => item.key
export function useOnViewableItemsChanged({
  disabled,
  idExtractor = defaultIdExtractor,
  onScroll: onScrollProp,
}: {
  disabled?: boolean
  idExtractor?: (item: ViewToken) => string
  onScroll?: (e: NativeSyntheticEvent<NativeScrollEvent>) => void
} = {}) {
  const orientation = useRef<"down" | "up">("down")
  const lastOffset = useRef(0)

  const markAsReadWhenScrolling = useGeneralSettingKey("scrollMarkUnread")
  const markAsReadWhenRendering = useGeneralSettingKey("renderMarkUnread")
  const [viewableItems, setViewableItems] = useState<ViewToken[]>([])
  const [lastViewableItems, setLastViewableItems] = useState<ViewToken[] | null>()
  const [lastRemovedItems, setLastRemovedItems] = useState<ViewToken[] | null>(null)

  const [stableIdExtractor] = useState(() => idExtractor)

  const onViewableItemsChanged: (info: {
    viewableItems: ViewToken[]
    changed: ViewToken[]
  }) => void = useNonReactiveCallback(({ viewableItems, changed }) => {
    setViewableItems(viewableItems)

    debouncedFetchEntryContentByStream(
      viewableItems.map((item) => stableIdExtractor(item)),
      { cookie: getCookie(), fetch: expoFetch as any },
    )
    const removed = changed.filter((item) => !item.isViewable)

    if (orientation.current === "down") {
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

export const usePagerListPerformanceHack = (provideRef?: RefObject<FlashList<any> | null>) => {
  const lastY = useRef(0)

  const onScroll = useEventCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!visible) return

    lastY.current = e.nativeEvent.contentOffset.y
  })

  const visible = use(PagerListVisibleContext)
  const willVisible = use(PagerListWillVisibleContext)

  const nextVisible = visible || willVisible

  const ref = useRef<FlashList<any>>(null)

  const usingRef = provideRef ?? ref
  const [style, setStyle] = useState<ViewStyle>({})
  useEffect(() => {
    if (!isAndroid) {
      // Always show the pager list on Android to avoid blank screen when switching tabs
      setStyle({ display: nextVisible ? "flex" : "none" })
    }
    if (nextVisible && lastY.current > 0) {
      requestAnimationFrame(() => {
        usingRef.current?.scrollToOffset({ offset: lastY.current, animated: false })
      })
    }
  }, [nextVisible, usingRef])

  return { onScroll, ref, style }
}

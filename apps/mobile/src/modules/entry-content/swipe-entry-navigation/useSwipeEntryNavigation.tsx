/**
 * useSwipeEntryNavigation — horizontal swipe between articles
 *
 * Wraps the entry detail screen content in a PagerView with prev/current/next entries.
 * Uses the same navigation pattern as pull-up-to-next (replaceControllerView with entryIds).
 *
 * Reference: PagerList.tsx for PagerView + Reanimated pattern
 */

import * as Haptics from "expo-haptics"
import { useCallback, useMemo, useRef } from "react"
import type { ViewStyle } from "react-native"
import { StyleSheet, View } from "react-native"
import type { PagerViewOnPageSelectedEventData } from "react-native-pager-view"
import PagerView from "react-native-pager-view"

interface UseSwipeEntryNavigationProps {
  entryId: string
  entryIds?: string[]
  onNavigateToEntry: (targetEntryId: string) => void
}

interface UseSwipeEntryNavigationReturn {
  /** Index of the current entry in the pager (0=prev, 1=current, 2=next) */
  currentPageIndex: number
  /** Whether swipe navigation is available (needs entryIds with adjacent entries) */
  canSwipe: boolean
  /** Previous entry ID, if available */
  prevEntryId: string | undefined
  /** Next entry ID, if available */
  nextEntryId: string | undefined
  /** The PagerView wrapper component */
  SwipeWrapper: React.FC<{ children: React.ReactNode; style?: ViewStyle }>
}

export function useSwipeEntryNavigation({
  entryId,
  entryIds,
  onNavigateToEntry,
}: UseSwipeEntryNavigationProps): UseSwipeEntryNavigationReturn {
  const pagerRef = useRef<PagerView>(null)

  const { prevEntryId, nextEntryId } = useMemo(() => {
    if (!entryIds) return { prevEntryId: undefined, nextEntryId: undefined }
    const idx = entryIds.indexOf(entryId)
    return {
      prevEntryId: idx > 0 ? entryIds[idx - 1] : undefined,
      nextEntryId: idx < entryIds.length - 1 ? entryIds[idx + 1] : undefined,
    }
  }, [entryId, entryIds])

  const canSwipe = !!(prevEntryId || nextEntryId)

  // The pager always shows the current entry in the middle (index 1),
  // with optional prev (index 0) and next (index 2)
  const currentPageIndex = prevEntryId ? 1 : 0

  const onPageSelected = useCallback(
    (e: { nativeEvent: PagerViewOnPageSelectedEventData }) => {
      const selectedPage = e.nativeEvent.position
      if (selectedPage === currentPageIndex) return // Didn't actually change

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

      // Determine which entry to navigate to
      let targetId: string | undefined
      if (selectedPage < currentPageIndex && prevEntryId) {
        targetId = prevEntryId
      } else if (selectedPage > currentPageIndex && nextEntryId) {
        targetId = nextEntryId
      }

      if (targetId) {
        // Small delay to let the swipe animation complete visually
        setTimeout(() => {
          onNavigateToEntry(targetId!)
        }, 150)
      }
    },
    [currentPageIndex, prevEntryId, nextEntryId, onNavigateToEntry],
  )

  const SwipeWrapper: React.FC<{ children: React.ReactNode; style?: ViewStyle }> = useCallback(
    ({ children, style }) => {
      if (!canSwipe) {
        // No adjacent entries — just render children directly
        return <View style={[styles.container, style]}>{children}</View>
      }

      // Build pages array — PagerView requires all children to be non-null Views
      const pages: React.ReactNode[] = []
      if (prevEntryId) {
        pages.push(
          <View key="prev" style={styles.page}>
            <View style={styles.placeholder} />
          </View>,
        )
      }
      pages.push(
        <View key="current" style={styles.page}>
          {children}
        </View>,
      )
      if (nextEntryId) {
        pages.push(
          <View key="next" style={styles.page}>
            <View style={styles.placeholder} />
          </View>,
        )
      }

      return (
        <PagerView
          ref={pagerRef}
          style={[styles.container, style]}
          initialPage={currentPageIndex}
          onPageSelected={onPageSelected}
          overdrag={false}
          overScrollMode="never"
        >
          {pages}
        </PagerView>
      )
    },
    [canSwipe, currentPageIndex, onPageSelected, prevEntryId, nextEntryId],
  )

  return {
    currentPageIndex,
    canSwipe,
    prevEntryId,
    nextEntryId,
    SwipeWrapper,
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  placeholder: {
    flex: 1,
  },
})

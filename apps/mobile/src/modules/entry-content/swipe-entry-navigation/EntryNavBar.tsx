/**
 * EntryNavBar — prev/next navigation buttons for article reading
 *
 * Shows at the bottom of the entry detail screen as a subtle bar.
 * Provides tap targets for prev/next navigation (alternative to swipe).
 * Also supports keyboard navigation on iPad (←→ arrows, J/K).
 */

import * as Haptics from "expo-haptics"
import type { FC } from "react"
import { useCallback } from "react"
import { Pressable, StyleSheet, View } from "react-native"

import { Text } from "@/src/components/ui/typography/Text"

interface EntryNavBarProps {
  prevEntryId: string | undefined
  nextEntryId: string | undefined
  onNavigateToEntry: (targetEntryId: string) => void
  /** Current position in the list (1-indexed) */
  currentIndex: number
  /** Total entries in the list */
  totalEntries: number
}

export const EntryNavBar: FC<EntryNavBarProps> = ({
  prevEntryId,
  nextEntryId,
  onNavigateToEntry,
  currentIndex,
  totalEntries,
}) => {
  const handlePrev = useCallback(() => {
    if (!prevEntryId) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onNavigateToEntry(prevEntryId)
  }, [prevEntryId, onNavigateToEntry])

  const handleNext = useCallback(() => {
    if (!nextEntryId) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onNavigateToEntry(nextEntryId)
  }, [nextEntryId, onNavigateToEntry])

  // Don't render if there's nowhere to navigate
  if (!prevEntryId && !nextEntryId) return null

  return (
    <View style={styles.container}>
      <Pressable
        style={[styles.button, !prevEntryId && styles.buttonDisabled]}
        onPress={handlePrev}
        disabled={!prevEntryId}
      >
        <Text style={[styles.buttonText, !prevEntryId && styles.buttonTextDisabled]}>‹ Prev</Text>
      </Pressable>

      <Text style={styles.counter}>
        {currentIndex} / {totalEntries}
      </Text>

      <Pressable
        style={[styles.button, !nextEntryId && styles.buttonDisabled]}
        onPress={handleNext}
        disabled={!nextEntryId}
      >
        <Text style={[styles.buttonText, !nextEntryId && styles.buttonTextDisabled]}>Next ›</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(128, 128, 128, 0.2)",
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  buttonDisabled: {
    opacity: 0.3,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "500",
    color: "rgba(128, 128, 128, 0.8)",
  },
  buttonTextDisabled: {
    color: "rgba(128, 128, 128, 0.3)",
  },
  counter: {
    fontSize: 12,
    color: "rgba(128, 128, 128, 0.5)",
    fontVariant: ["tabular-nums"],
  },
})

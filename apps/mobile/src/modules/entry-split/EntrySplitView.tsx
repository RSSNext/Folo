import { atom, useAtomValue, useStore } from "jotai"
import type { PropsWithChildren } from "react"
import { use, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"
import { useSharedValue } from "react-native-reanimated"
import { useSafeAreaFrame } from "react-native-safe-area-context"
import { useColor } from "react-native-uikit-colors"

import { BottomTabBarBackgroundContext } from "@/src/components/layouts/tabbar/contexts/BottomTabBarBackgroundContext"
import { useBottomTabBarHeight } from "@/src/components/layouts/tabbar/hooks"
import { Text } from "@/src/components/ui/typography/Text"
import { Book6CuteReIcon } from "@/src/icons/book_6_cute_re"
import type { TabScreenContextType } from "@/src/lib/navigation/bottom-tab/TabScreenContext"
import { TabScreenContext } from "@/src/lib/navigation/bottom-tab/TabScreenContext"
import { ChainNavigationContext } from "@/src/lib/navigation/ChainNavigationContext"
import { ScreenItemContext } from "@/src/lib/navigation/ScreenItemContext"
import { EntryListContext, useSelectedFeed, useSelectedView } from "@/src/modules/screen/atoms"
import { EntryDetailScreen } from "@/src/screens/(stack)/entries/[entryId]/EntryDetailScreen"

import type { OpenedEntry } from "./context"
import { EntrySplitContext, EntrySplitPaneContext } from "./context"
import { getEntrySplitListWidth, isEntrySplitLayoutWidth, viewOpensEntryReader } from "./layout"
import { SplitPane } from "./SplitPane"

/**
 * Shows the entries tapped in a list next to it on a window wide enough, as on iPad, instead of
 * pushing the reader over the list. Narrower windows show the list alone, as on iPhone.
 */
export const EntrySplitView = ({ children }: PropsWithChildren) => {
  const { width } = useSafeAreaFrame()
  if (!isEntrySplitLayoutWidth(width)) return children
  return <EntrySplitLayout width={width}>{children}</EntrySplitLayout>
}

/** How long the view pager under the list takes to animate to the view selected above it */
const PAGER_ANIMATION_DURATION = 400

const EntrySplitLayout = ({ width, children }: PropsWithChildren<{ width: number }>) => {
  const store = useStore()
  const view = useSelectedView()
  const selectedFeed = useSelectedFeed()
  // The pager loses its place when its width changes while it animates, so the list widens or
  // narrows for another kind of view once the pager is there
  const showsReader = useSettledValue(viewOpensEntryReader(view), PAGER_ANIMATION_DURATION)
  const listWidth = showsReader ? getEntrySplitListWidth(width) : width
  const readerWidth = width - listWidth - StyleSheet.hairlineWidth

  const [readingEntryIdAtom] = useState(() => atom<string | null>(null))
  const [opened, setOpened] = useState<{ entry: OpenedEntry; key: number } | null>(null)
  const openEntry = useCallback(
    (entry: OpenedEntry) => {
      // Tapping the entry being read keeps the reader where it is
      if (store.get(readingEntryIdAtom) === entry.entryId) return
      store.set(readingEntryIdAtom, entry.entryId)
      setOpened((previous) => ({ entry, key: (previous?.key ?? 0) + 1 }))
    },
    [readingEntryIdAtom, store],
  )
  // Another timeline lists other entries, so the reader closes with the one it showed
  const timelineKey = `${JSON.stringify(selectedFeed)}:${view}`
  useEffect(() => {
    store.set(readingEntryIdAtom, null)
    setOpened(null)
  }, [readingEntryIdAtom, store, timelineKey])

  const splitValue = useMemo(
    () => ({ readingEntryIdAtom, openEntry }),
    [openEntry, readingEntryIdAtom],
  )
  const bottomInset = useBottomTabBarHeight()
  const webViewResendSignal = useOnTopAgainSignal()
  const paneValue = useMemo(
    () => ({
      bottomInset,
      onReadingEntryChange: (entryId: string) => store.set(readingEntryIdAtom, entryId),
      webViewResendSignal,
    }),
    [bottomInset, readingEntryIdAtom, store, webViewResendSignal],
  )
  const { screenId } = use(ScreenItemContext)

  return (
    <EntrySplitContext value={splitValue}>
      <View className="flex-1 flex-row">
        <SplitPane width={listWidth} windowEdges={showsReader ? listWindowEdges : bothWindowEdges}>
          {children}
        </SplitPane>
        {showsReader && (
          <>
            <View className="h-full bg-opaque-separator" style={styles.separator} />
            <SplitPane
              width={readerWidth}
              windowEdges={readerWindowEdges}
              screenId={`${screenId}-reader`}
            >
              <ReaderPaneScope>
                <EntrySplitPaneContext value={paneValue}>
                  {opened ? (
                    <EntryDetailScreen key={opened.key} {...opened.entry} />
                  ) : (
                    <NoEntryOpen />
                  )}
                </EntrySplitPaneContext>
              </ReaderPaneScope>
            </SplitPane>
          </>
        )}
      </View>
    </EntrySplitContext>
  )
}

const bothWindowEdges = { left: true, right: true }
const listWindowEdges = { left: true, right: false }
const readerWindowEdges = { left: false, right: true }

// What a reader pushed onto the root stack gets, outside the list's screen
const pushedReaderEntryListContext = { type: "timeline" } as const

/** Leaves out what the list's screen sets up for the list, so the reader works as when pushed */
const ReaderPaneScope = ({ children }: PropsWithChildren) => {
  // The reader would otherwise clear the tab bar background under the list as it scrolls to its end
  const opacity = useSharedValue(1)
  const tabBarBackground = useMemo(() => ({ opacity }), [opacity])
  return (
    <EntryListContext value={pushedReaderEntryListContext}>
      <BottomTabBarBackgroundContext value={tabBarBackground}>
        {children}
      </BottomTabBarBackgroundContext>
    </EntryListContext>
  )
}

const useSettledValue = <T,>(value: T, delay: number) => {
  const [settled, setSettled] = useState(value)
  useEffect(() => {
    if (Object.is(settled, value)) return
    const timer = setTimeout(() => setSettled(value), delay)
    return () => clearTimeout(timer)
  }, [delay, settled, value])
  return settled
}

/**
 * Counts the times the screen comes back on top of the stack. A screen pushed over it may have
 * moved the shared web view into its own reader and shown another entry there.
 */
const useOnTopAgainSignal = () => {
  const { screenId } = use(ScreenItemContext)
  // Null for screens pushed onto the root stack, which are routes of their own
  const tabScreen = use(TabScreenContext) as TabScreenContextType | null
  const ownRouteId = tabScreen ? undefined : screenId
  const { routesAtom } = use(ChainNavigationContext)
  const isOnTop = useAtomValue(
    useMemo(
      () => atom((get) => get(routesAtom).at(-1)?.id === ownRouteId),
      [ownRouteId, routesAtom],
    ),
  )
  const [signal, setSignal] = useState(0)
  const wasOnTopRef = useRef(isOnTop)
  useEffect(() => {
    if (isOnTop && !wasOnTopRef.current) setSignal((value) => value + 1)
    wasOnTopRef.current = isOnTop
  }, [isOnTop])
  return signal
}

const NoEntryOpen = () => {
  const { t } = useTranslation()
  const tertiaryLabel = useColor("tertiaryLabel")
  const bottomInset = useBottomTabBarHeight()
  return (
    <View
      className="flex-1 items-center justify-center gap-3 px-8"
      style={{ paddingBottom: bottomInset }}
    >
      <Book6CuteReIcon width={44} height={44} color={tertiaryLabel} />
      <Text className="text-center text-base text-tertiary-label">{t("entry.select_to_read")}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  separator: { width: StyleSheet.hairlineWidth },
})

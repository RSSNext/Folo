import { FeedViewType, UserRole } from "@follow/constants"
import { getEntry } from "@follow/store/entry/getter"
import { useEntry, useEntryReadHistory, usePrefetchEntryDetail } from "@follow/store/entry/hooks"
import { entrySyncServices } from "@follow/store/entry/store"
import { useFeedById } from "@follow/store/feed/hooks"
import { usePrefetchEntryTranslation } from "@follow/store/translation/hooks"
import { useAutoMarkAsRead } from "@follow/store/unread/hooks"
import { useIsLoggedIn, useUserRole } from "@follow/store/user/hooks"
import { PortalProvider } from "@gorhom/portal"
import { useQuery } from "@tanstack/react-query"
import * as WebBrowser from "expo-web-browser"
import { atom, useAtomValue, useSetAtom } from "jotai"
import { use, useCallback, useEffect, useMemo, useState } from "react"
import { View } from "react-native"
import type { SharedValue } from "react-native-reanimated"
import Animated, { FadeInDown, FadeInUp, useSharedValue, withTiming } from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useColor } from "react-native-uikit-colors"

import { useActionLanguage, useGeneralSettingKey } from "@/src/atoms/settings/general"
import { useUISettingKey } from "@/src/atoms/settings/ui"
import { BottomTabBarHeightContext } from "@/src/components/layouts/tabbar/contexts/BottomTabBarHeightContext"
import { SafeNavigationScrollView } from "@/src/components/layouts/views/SafeNavigationScrollView"
import { EntryContentWebView } from "@/src/components/native/webview/EntryContentWebView"
import { WebViewManager } from "@/src/components/native/webview/webview-manager"
import { RelativeDateTime } from "@/src/components/ui/datetime/RelativeDateTime"
import { FeedIcon } from "@/src/components/ui/icon/feed-icon"
import { ItemPressableStyle } from "@/src/components/ui/pressable/enum"
import { ItemPressable } from "@/src/components/ui/pressable/ItemPressable"
import { Text } from "@/src/components/ui/typography/Text"
import { CalendarTimeAddCuteReIcon } from "@/src/icons/calendar_time_add_cute_re"
import { Eye2CuteReIcon } from "@/src/icons/eye_2_cute_re"
import { openLink } from "@/src/lib/native"
import { ScreenItemContext } from "@/src/lib/navigation/ScreenItemContext"
import type { NavigationControllerView } from "@/src/lib/navigation/types"
import { isWebUrl } from "@/src/lib/web-url"
import {
  EntryContentContext,
  EntryReaderBarsHiddenContext,
  useEntryContentContext,
} from "@/src/modules/entry-content/ctx"
import type { EntryNavigationDirection } from "@/src/modules/entry-content/entry-navigation/adjacent-entries"
import { getAdjacentEntryIds } from "@/src/modules/entry-content/entry-navigation/adjacent-entries"
import { ENTRY_NAVIGATION_CONTROL_INSET } from "@/src/modules/entry-content/entry-navigation/constants"
import type { EntryListSource } from "@/src/modules/entry-content/entry-navigation/entry-list-source"
import { useNavigableEntryIds } from "@/src/modules/entry-content/entry-navigation/entry-list-source"
import { EntryNavigationControl } from "@/src/modules/entry-content/entry-navigation/EntryNavigationControl"
import { EntryAISummary } from "@/src/modules/entry-content/EntryAISummary"
import { EntryNavigationHeader } from "@/src/modules/entry-content/EntryNavigationHeader"
import { useEntryExternalUrl } from "@/src/modules/entry-content/external-url"
import { usePullUpToNext } from "@/src/modules/entry-content/pull-up-navigation/use-pull-up-navigation"
import { EntrySplitPaneContext } from "@/src/modules/entry-split/context"
import { usePreferredFeedTitle } from "@/src/modules/feed/feed-title"
import { useFloatingPlayerBarInset } from "@/src/modules/player/hooks"

import { EntrySocialTitle, EntryTitle } from "../../../../modules/entry-content/EntryTitle"

const BARS_ANIMATION = { duration: 200 }
// The content comes in from the side the entry is on in the list
const contentEntering = {
  next: FadeInUp.duration(250),
  previous: FadeInDown.duration(250),
}

export const EntryDetailScreen: NavigationControllerView<{
  entryId: string
  entryIds?: string[]
  /** The list the entry was opened from, which loads the entries after `entryIds` */
  entryListSource?: EntryListSource
  view: FeedViewType
  isInbox?: boolean
}> = ({ entryId: openedEntryId, entryIds, entryListSource, view, isInbox }) => {
  // Previous and next swap the entry in place, so the screen pushed from the list stays with its
  // back gesture and the controls stay under the thumb
  const [reading, setReading] = useState<{
    entryId: string
    direction?: EntryNavigationDirection
  }>({ entryId: openedEntryId })
  const { entryId } = reading
  const navigableEntryIds = useNavigableEntryIds(entryId, entryIds, entryListSource)
  const { previousEntryId, nextEntryId } = useMemo(
    () => getAdjacentEntryIds(navigableEntryIds, entryId),
    [entryId, navigableEntryIds],
  )
  // The next entry is the one most often read after this one, so its content loads ahead
  usePrefetchEntryDetail(nextEntryId, isInbox, { enabled: !!nextEntryId })

  const insets = useSafeAreaInsets()
  const floatingPlayerBarInset = useFloatingPlayerBarInset()
  // Next to the list, the reader ends above the tab bar, which holds the player bar there
  const splitPane = use(EntrySplitPaneContext)
  const bottomInset = splitPane ? splitPane.bottomInset : insets.bottom + floatingPlayerBarInset
  const hasNavigation = !!previousEntryId || !!nextEntryId
  const { reAnimatedScrollY } = use(ScreenItemContext)
  const barsHiddenProgress = useSharedValue(0)
  const pullingUpProgress = useSharedValue(0)

  const navigate = useCallback(
    (direction: EntryNavigationDirection) => {
      const targetEntryId = direction === "next" ? nextEntryId : previousEntryId
      if (!targetEntryId) return
      // Starts rendering it in the shared web view, as opening it from the list does
      const targetEntry = getEntry(targetEntryId)
      if (targetEntry) WebViewManager.setEntry(targetEntry)
      // It opens at its top, where the header and the controls always show
      reAnimatedScrollY.value = 0
      barsHiddenProgress.value = withTiming(0, BARS_ANIMATION)
      pullingUpProgress.value = withTiming(0, BARS_ANIMATION)
      setReading({ entryId: targetEntryId, direction })
      entryListSource?.revealEntry(targetEntryId)
      splitPane?.onReadingEntryChange(targetEntryId)
    },
    [
      barsHiddenProgress,
      entryListSource,
      nextEntryId,
      previousEntryId,
      pullingUpProgress,
      reAnimatedScrollY,
      splitPane,
    ],
  )
  const navigateToNext = useCallback(() => navigate("next"), [navigate])

  return (
    <EntryReaderBarsHiddenContext value={barsHiddenProgress}>
      <PortalProvider>
        <BottomTabBarHeightContext
          value={bottomInset + (hasNavigation ? ENTRY_NAVIGATION_CONTROL_INSET : 0)}
        >
          <EntryReader
            key={entryId}
            entryId={entryId}
            view={view}
            isInbox={isInbox}
            enteringDirection={reading.direction}
            onPullUpToNext={nextEntryId ? navigateToNext : undefined}
            pullingUpProgress={pullingUpProgress}
          />
          <EntryNavigationControl
            canGoPrevious={!!previousEntryId}
            canGoNext={!!nextEntryId}
            bottomInset={splitPane?.bottomInset}
            onNavigate={navigate}
            barsHiddenProgress={barsHiddenProgress}
            pullingUpProgress={pullingUpProgress}
          />
        </BottomTabBarHeightContext>
      </PortalProvider>
    </EntryReaderBarsHiddenContext>
  )
}

/** One entry in the reader, mounted afresh for each entry read in turn */
const EntryReader = ({
  entryId,
  view: viewType,
  isInbox,
  enteringDirection,
  onPullUpToNext,
  pullingUpProgress,
}: {
  entryId: string
  view: FeedViewType
  isInbox?: boolean
  enteringDirection?: EntryNavigationDirection
  /** Pulling up past the end opens the next entry, when there is one */
  onPullUpToNext?: () => void
  pullingUpProgress: SharedValue<number>
}) => {
  usePrefetchEntryDetail(entryId, isInbox)
  const entry = useEntry(entryId, (state) => ({
    title: state.title,
    summary: state.settings?.summary,
    translation: state.settings?.translation,
    readability: state.settings?.readability,
    sourceContent: state.settings?.sourceContent,
  }))
  // Onboarding entries have no link outside the app, and relative links resolve first
  const externalUrl = useEntryExternalUrl(entryId)
  const isLoggedIn = useIsLoggedIn()
  useAutoMarkAsRead(entryId, !!entry && isLoggedIn)
  const ctxValue = useMemo(
    () => ({
      showAISummaryAtom: atom(entry?.summary || false),
      showAITranslationAtom: atom(!!entry?.translation || false),
      showReadabilityAtom: atom(entry?.readability || false),
      showSourceContentAtom: atom(entry?.sourceContent || false),
      titleHeightAtom: atom(0),
    }),
    [entry?.readability, entry?.sourceContent, entry?.summary, entry?.translation],
  )
  const {
    EntryPullUpToNext,
    scrollViewEventHandlers,
    pullUpViewProps,
    GestureWrapper,
    gestureWrapperProps,
    isPulling,
  } = usePullUpToNext({
    enabled: !!onPullUpToNext,
    onRefresh: onPullUpToNext,
  })
  // The pull-up indicator shows where the controls float, so they make way while pulling
  useEffect(() => {
    pullingUpProgress.value = withTiming(isPulling ? 1 : 0, BARS_ANIMATION)
  }, [isPulling, pullingUpProgress])

  return (
    <EntryContentContext value={ctxValue}>
      <GestureWrapper {...gestureWrapperProps}>
        <SafeNavigationScrollView
          Header={<EntryNavigationHeader entryId={entryId} />}
          ScrollViewBottom={<EntryPullUpToNext {...pullUpViewProps} />}
          automaticallyAdjustContentInsets={false}
          contentContainerMaxWidth={680}
          contentContainerClassName="flex min-h-full pb-16"
          {...scrollViewEventHandlers}
        >
          <Animated.View entering={enteringDirection && contentEntering[enteringDirection]}>
            <ItemPressable
              itemStyle={ItemPressableStyle.UnStyled}
              onPress={() => externalUrl && openLink(externalUrl)}
              className="rounded-xl px-5 py-4"
            >
              {viewType === FeedViewType.SocialMedia ? (
                <EntrySocialTitle entryId={entryId} />
              ) : (
                <>
                  <EntryTitle title={entry?.title || ""} entryId={entryId} />
                  <EntryInfo entryId={entryId} />
                </>
              )}
            </ItemPressable>
            <View className="px-5">
              <EntryAISummary entryId={entryId} />
            </View>
            {entry && (
              <View className="mt-3 w-full px-5">
                <EntryContentWebViewWithContext entryId={entryId} />
              </View>
            )}
            {viewType === FeedViewType.SocialMedia && (
              <View className="mt-2 px-5">
                <EntryInfoSocial entryId={entryId} />
              </View>
            )}
          </Animated.View>
        </SafeNavigationScrollView>
      </GestureWrapper>
    </EntryContentContext>
  )
}
const EntryContentWebViewWithContext = ({ entryId }: { entryId: string }) => {
  const { showReadabilityAtom, showAITranslationAtom, showSourceContentAtom } =
    useEntryContentContext()
  const showReadabilityOnce = useAtomValue(showReadabilityAtom)
  const translationSetting = useGeneralSettingKey("translation")
  const translationMode = useGeneralSettingKey("translationMode")
  const showTranslationOnce = useAtomValue(showAITranslationAtom)
  const actionLanguage = useActionLanguage()
  const userRole = useUserRole()
  const showTranslation = translationSetting || showTranslationOnce
  const translationPrefetchEnabled =
    showTranslation &&
    (userRole == null || (userRole !== UserRole.Free && userRole !== UserRole.Trial))
  const entry = useEntry(entryId, (state) => ({
    content: state.content,
    readabilityContent: state.readabilityContent,
  }))
  const externalUrl = useEntryExternalUrl(entryId)
  usePrefetchEntryTranslation({
    entryIds: [entryId],
    withContent: true,
    target: showReadabilityOnce && entry?.readabilityContent ? "readabilityContent" : "content",
    language: actionLanguage,
    enabled: translationPrefetchEnabled,
    mode: translationMode,
  })

  // Auto toggle readability when content is empty
  const setShowReadability = useSetAtom(showReadabilityAtom)
  const {
    isPending,
    isFetching,
    isError,
    refetch: refetchEntryDetail,
  } = usePrefetchEntryDetail(entryId)
  useEffect(() => {
    // Only once the server said there is no content; a request that failed, as offline, says
    // nothing about it
    if (!isPending && !isError && !entry?.content) {
      setShowReadability(true)
    }
  }, [isPending, isError, entry?.content, setShowReadability])
  const readabilityQuery = useQuery({
    queryKey: ["entry-readability", entryId],
    queryFn: async () => {
      await entrySyncServices.fetchEntryReadabilityContent(entryId)
      return null
    },
    enabled: showReadabilityOnce,
    retry: false,
  })

  const showSourceContent = useAtomValue(showSourceContentAtom)
  useEffect(() => {
    // The browser shows web pages only
    if (showSourceContent && externalUrl && isWebUrl(externalUrl)) {
      WebBrowser.openBrowserAsync(externalUrl).catch((error: unknown) => {
        console.warn("[entry] the browser did not open the source", error)
      })
    }
  }, [externalUrl, showSourceContent])

  const refetchReadability = readabilityQuery.refetch
  const retryContent = useCallback(() => {
    void refetchEntryDetail()
    if (showReadabilityOnce) void refetchReadability()
  }, [refetchEntryDetail, refetchReadability, showReadabilityOnce])
  const webViewResendSignal = use(EntrySplitPaneContext)?.webViewResendSignal

  return (
    <EntryContentWebView
      entryId={entryId}
      showReadability={showReadabilityOnce}
      showTranslation={showTranslation}
      // A retry of a failed request keeps its error until it settles, so it counts as pending
      isContentPending={showReadabilityOnce ? readabilityQuery.isFetching : isPending || isFetching}
      onRetry={retryContent}
      resendSignal={webViewResendSignal}
    />
  )
}
const EntryInfo = ({ entryId }: { entryId: string }) => {
  const entry = useEntry(entryId, (state) => ({
    publishedAt: state.publishedAt,
    feedId: state.feedId,
  }))
  const isLoggedIn = useIsLoggedIn()
  const feed = useFeedById(entry?.feedId)
  const feedTitle = usePreferredFeedTitle(entry?.feedId)
  const secondaryLabelColor = useColor("secondaryLabel")
  const readCount = useEntryReadHistory(entryId, 20, isLoggedIn)?.entryReadHistories?.readCount ?? 0
  const hideRecentReader = useUISettingKey("hideRecentReader")
  if (!entry) return null
  const { publishedAt } = entry
  return (
    <View className="mt-4 flex flex-row items-center gap-4">
      {feed && (
        <View className="flex shrink flex-row items-center gap-2">
          <FeedIcon feed={feed} />
          <Text className="shrink text-xs font-medium leading-tight text-label" numberOfLines={1}>
            {feedTitle?.trim()}
          </Text>
        </View>
      )}
      <View className="flex flex-row items-center gap-1">
        <CalendarTimeAddCuteReIcon width={16} height={16} color={secondaryLabelColor} />
        <RelativeDateTime
          date={publishedAt}
          className="text-xs leading-tight text-secondary-label"
        />
      </View>
      {isLoggedIn && !hideRecentReader && (
        <View className="flex flex-row items-center gap-1">
          <Eye2CuteReIcon width={16} height={16} color={secondaryLabelColor} />
          <Text className="text-xs leading-tight text-secondary-label">{readCount}</Text>
        </View>
      )}
    </View>
  )
}
const EntryInfoSocial = ({ entryId }: { entryId: string }) => {
  const entry = useEntry(entryId, (state) => ({
    publishedAt: state.publishedAt,
  }))
  if (!entry) return null
  return (
    <View className="mt-3">
      <Text className="text-sm text-secondary-label">
        {entry.publishedAt.toLocaleString(undefined, {
          dateStyle: "medium",
          timeStyle: "short",
        })}
      </Text>
    </View>
  )
}

import { FeedViewType } from "@follow/constants"
import { useEntry, useEntryReadHistory, usePrefetchEntryDetail } from "@follow/store/entry/hooks"
import { entrySyncServices } from "@follow/store/entry/store"
import { useFeedById } from "@follow/store/feed/hooks"
import { usePrefetchEntryTranslation } from "@follow/store/translation/hooks"
import { useAutoMarkAsRead } from "@follow/store/unread/hooks"
import { PortalProvider } from "@gorhom/portal"
import { atom, useAtomValue, useSetAtom } from "jotai"
import { useCallback, useEffect, useMemo } from "react"
import { Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useColor } from "react-native-uikit-colors"

import { useActionLanguage, useGeneralSettingKey } from "@/src/atoms/settings/general"
import { useUISettingKey } from "@/src/atoms/settings/ui"
import { BottomTabBarHeightContext } from "@/src/components/layouts/tabbar/contexts/BottomTabBarHeightContext"
import { SafeNavigationScrollView } from "@/src/components/layouts/views/SafeNavigationScrollView"
import { EntryContentWebView } from "@/src/components/native/webview/EntryContentWebView"
import { RelativeDateTime } from "@/src/components/ui/datetime/RelativeDateTime"
import { FeedIcon } from "@/src/components/ui/icon/feed-icon"
import { ItemPressableStyle } from "@/src/components/ui/pressable/enum"
import { ItemPressable } from "@/src/components/ui/pressable/ItemPressable"
import { CalendarTimeAddCuteReIcon } from "@/src/icons/calendar_time_add_cute_re"
import { openLink } from "@/src/lib/native"
import { useNavigation } from "@/src/lib/navigation/hooks"
import type { NavigationControllerView } from "@/src/lib/navigation/types"
import { checkLanguage } from "@/src/lib/translation"
import { EntryContentContext, useEntryContentContext } from "@/src/modules/entry-content/ctx"
import { EntryAISummary } from "@/src/modules/entry-content/EntryAISummary"
import { EntryNavigationHeader } from "@/src/modules/entry-content/EntryNavigationHeader"
import { usePullUpToNext } from "@/src/modules/entry-content/use-pull-up-to-next"

import { EntrySocialTitle, EntryTitle } from "../../../../modules/entry-content/EntryTitle"

export const EntryDetailScreen: NavigationControllerView<{
  entryId: string
  entryIds?: string[]
  view: FeedViewType
}> = ({ entryId, entryIds, view: viewType }) => {
  useAutoMarkAsRead(entryId)
  const entry = useEntry(entryId, (state) => ({
    title: state.title,
    url: state.url,
    summary: state.settings?.summary,
    translation: state.settings?.translation,
    readability: state.settings?.readability,
  }))

  const insets = useSafeAreaInsets()
  const ctxValue = useMemo(
    () => ({
      showAISummaryAtom: atom(entry?.summary || false),
      showAITranslationAtom: atom(!!entry?.translation || false),
      showReadabilityAtom: atom(entry?.readability || false),

      titleHeightAtom: atom(0),
    }),
    [entry?.readability, entry?.summary, entry?.translation],
  )

  const navigation = useNavigation()
  const nextEntryId = useMemo(() => {
    if (!entryIds) return
    const currentEntryIdx = entryIds.indexOf(entryId)
    return entryIds[currentEntryIdx + 1]
  }, [entryId, entryIds])

  const { EntryPullUpToNext, scrollViewEventHandlers, pullUpViewProps } = usePullUpToNext({
    enabled: !!nextEntryId,
    onRefresh: useCallback(() => {
      if (!nextEntryId) return
      navigation.replaceControllerView(
        EntryDetailScreen,
        {
          entryId: nextEntryId,
          entryIds,
          view: viewType,
        },
        {
          // Ensure that the replace animation is used
          stackAnimation: "fade_from_bottom",
          transitionDuration: 300,
        },
      )
    }, [entryIds, navigation, nextEntryId, viewType]),
  })

  return (
    <EntryContentContext value={ctxValue}>
      <PortalProvider>
        <BottomTabBarHeightContext value={insets.bottom}>
          <SafeNavigationScrollView
            Header={<EntryNavigationHeader entryId={entryId} />}
            ScrollViewBottom={<EntryPullUpToNext {...pullUpViewProps} />}
            automaticallyAdjustContentInsets={false}
            contentContainerClassName="flex min-h-full pb-16"
            {...scrollViewEventHandlers}
          >
            <ItemPressable
              itemStyle={ItemPressableStyle.UnStyled}
              onPress={() => entry?.url && openLink(entry.url)}
              className="rounded-xl py-4"
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
            <EntryAISummary entryId={entryId} />
            {entry && (
              <View className="mt-3">
                <EntryContentWebViewWithContext entryId={entryId} />
              </View>
            )}
            {viewType === FeedViewType.SocialMedia && (
              <View className="mt-2">
                <EntryInfoSocial entryId={entryId} />
              </View>
            )}
          </SafeNavigationScrollView>
        </BottomTabBarHeightContext>
      </PortalProvider>
    </EntryContentContext>
  )
}

const EntryContentWebViewWithContext = ({ entryId }: { entryId: string }) => {
  const { showReadabilityAtom, showAITranslationAtom } = useEntryContentContext()
  const showReadabilityOnce = useAtomValue(showReadabilityAtom)
  const translationSetting = useGeneralSettingKey("translation")
  const showTranslationOnce = useAtomValue(showAITranslationAtom)
  const actionLanguage = useActionLanguage()
  const translation = useGeneralSettingKey("translation")

  const entry = useEntry(entryId, (state) => ({
    content: state.content,
    readabilityContent: state.readabilityContent,
  }))

  usePrefetchEntryTranslation({
    entryIds: [entryId],
    withContent: true,
    target: showReadabilityOnce && entry?.readabilityContent ? "readabilityContent" : "content",
    language: actionLanguage,
    checkLanguage,
    setting: translation,
  })

  // Auto toggle readability when content is empty
  const setShowReadability = useSetAtom(showReadabilityAtom)
  const { isPending } = usePrefetchEntryDetail(entryId)
  useEffect(() => {
    if (!isPending && !entry?.content) {
      setShowReadability(true)
    }
  }, [isPending, entry?.content, setShowReadability])

  useEffect(() => {
    if (showReadabilityOnce) {
      entrySyncServices.fetchEntryReadabilityContent(entryId)
    }
  }, [showReadabilityOnce, entryId])

  return (
    <EntryContentWebView
      entryId={entryId}
      showReadability={showReadabilityOnce}
      showTranslation={translationSetting || showTranslationOnce}
    />
  )
}

const EntryInfo = ({ entryId }: { entryId: string }) => {
  const entry = useEntry(entryId, (state) => ({
    publishedAt: state.publishedAt,
    feedId: state.feedId,
  }))
  const feed = useFeedById(entry?.feedId)
  const secondaryLabelColor = useColor("secondaryLabel")

  const readCount = useEntryReadHistory(entryId)?.entryReadHistories?.readCount
  const hideRecentReader = useUISettingKey("hideRecentReader")

  if (!entry) return null

  const { publishedAt } = entry

  return (
    <View className="mt-4 flex flex-row items-center gap-4 px-5">
      {feed && (
        <View className="flex shrink flex-row items-center gap-2">
          <FeedIcon feed={feed} />
          <Text className="text-label shrink text-sm font-medium leading-tight" numberOfLines={1}>
            {feed.title?.trim()}
          </Text>
        </View>
      )}
      <View className="flex flex-row items-center gap-1">
        <CalendarTimeAddCuteReIcon width={16} height={16} color={secondaryLabelColor} />
        <RelativeDateTime
          date={publishedAt}
          className="text-secondary-label text-sm leading-tight"
        />
      </View>
      {!hideRecentReader && (
        <View className="flex flex-row items-center gap-1">
          <Text className="text-secondary-label text-sm leading-tight">{readCount}</Text>
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
    <View className="mt-3 px-4">
      <Text className="text-secondary-label">
        {entry.publishedAt.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
      </Text>
    </View>
  )
}

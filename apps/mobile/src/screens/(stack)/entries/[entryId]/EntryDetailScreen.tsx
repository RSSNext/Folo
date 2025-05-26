import { FeedViewType } from "@follow/constants"
import { useEntry, usePrefetchEntryDetail } from "@follow/store/src/entry/hooks"
import { entrySyncServices } from "@follow/store/src/entry/store"
import type { EntryWithTranslation } from "@follow/store/src/entry/types"
import { useFeed } from "@follow/store/src/feed/hooks"
import {
  useEntryTranslation,
  usePrefetchEntryTranslation,
} from "@follow/store/src/translation/hooks"
import { useAutoMarkAsRead } from "@follow/store/src/unread/hooks"
import { PortalProvider } from "@gorhom/portal"
import { atom, useAtomValue, useSetAtom } from "jotai"
import { useCallback, useEffect, useMemo } from "react"
import { Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useColor } from "react-native-uikit-colors"

import { useActionLanguage, useGeneralSettingKey } from "@/src/atoms/settings/general"
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
  const entry = useEntry(entryId)
  const actionLanguage = useActionLanguage()
  const translation = useEntryTranslation(entryId, actionLanguage)
  const entryWithTranslation = useMemo(() => {
    if (!entry) return entry
    return {
      ...entry,
      translation,
    } as EntryWithTranslation
  }, [entry, translation])

  const insets = useSafeAreaInsets()
  const ctxValue = useMemo(
    () => ({
      showAISummaryAtom: atom(entry?.settings?.summary || false),
      showAITranslationAtom: atom(!!entry?.settings?.translation || false),
      showReadabilityAtom: atom(entry?.settings?.readability || false),

      titleHeightAtom: atom(0),
    }),
    [entry?.settings?.readability, entry?.settings?.summary, entry?.settings?.translation],
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
      navigation.back()
      navigation.pushControllerView(EntryDetailScreen, {
        entryId: nextEntryId,
        entryIds,
        view: viewType,
      })
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
            {entryWithTranslation && (
              <View className="mt-3">
                <EntryContentWebViewWithContext entry={entryWithTranslation} />
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

const EntryContentWebViewWithContext = ({ entry }: { entry: EntryWithTranslation }) => {
  const { showReadabilityAtom, showAITranslationAtom } = useEntryContentContext()
  const showReadability = useAtomValue(showReadabilityAtom)
  const translationSetting = useGeneralSettingKey("translation")
  const showTranslation = useAtomValue(showAITranslationAtom)
  const entryId = entry.id
  const actionLanguage = useActionLanguage()
  const translation = useGeneralSettingKey("translation")
  usePrefetchEntryTranslation({
    entryIds: [entryId],
    withContent: true,
    target: showReadability && entry.readabilityContent ? "readabilityContent" : "content",
    language: actionLanguage,
    checkLanguage,
    translation,
  })

  // Auto toggle readability when content is empty
  const setShowReadability = useSetAtom(showReadabilityAtom)
  const { isPending } = usePrefetchEntryDetail(entryId)
  useEffect(() => {
    if (!isPending && !entry.content) {
      setShowReadability(true)
    }
  }, [isPending, entry.content, setShowReadability])

  useEffect(() => {
    if (showReadability) {
      entrySyncServices.fetchEntryReadabilityContent(entryId)
    }
  }, [showReadability, entryId])

  return (
    <EntryContentWebView
      entry={entry}
      showReadability={showReadability}
      showTranslation={translationSetting || showTranslation}
    />
  )
}

const EntryInfo = ({ entryId }: { entryId: string }) => {
  const entry = useEntry(entryId)
  const feed = useFeed(entry?.feedId)
  const secondaryLabelColor = useColor("secondaryLabel")

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
    </View>
  )
}

const EntryInfoSocial = ({ entryId }: { entryId: string }) => {
  const entry = useEntry(entryId)

  if (!entry) return null
  const { publishedAt } = entry
  return (
    <View className="mt-3 px-4">
      <Text className="text-secondary-label">
        {publishedAt.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
      </Text>
    </View>
  )
}

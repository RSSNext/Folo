import { FeedViewType, UserRole } from "@follow/constants"
import { useIsEntryStarred } from "@follow/store/collection/hooks"
import { collectionSyncService } from "@follow/store/collection/store"
import { useEntry } from "@follow/store/entry/hooks"
import { entrySyncServices } from "@follow/store/entry/store"
import { useFeedById } from "@follow/store/feed/hooks"
import { useSubscriptionById } from "@follow/store/subscription/hooks"
import { translationSyncService } from "@follow/store/translation/store"
import { useIsLoggedIn, useUserRole } from "@follow/store/user/hooks"
import { setStringAsync } from "expo-clipboard"
import { useAtom } from "jotai"
import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Platform, Pressable, Share, View } from "react-native"
import type { SharedValue } from "react-native-reanimated"
import Animated, { interpolate, useAnimatedStyle } from "react-native-reanimated"
import { useColor } from "react-native-uikit-colors"
import type { MenuItemIconProps } from "zeego/lib/typescript/menu"

import { getActionLanguage, useGeneralSettingKey } from "@/src/atoms/settings/general"
import { ActionBarItem } from "@/src/components/ui/action-bar/ActionBarItem"
import { DropdownMenu } from "@/src/components/ui/context-menu"
import { DocmentCuteReIcon } from "@/src/icons/docment_cute_re"
import { More1CuteReIcon } from "@/src/icons/more_1_cute_re"
import { ShareForwardCuteReIcon } from "@/src/icons/share_forward_cute_re"
import { StarCuteFiIcon } from "@/src/icons/star_cute_fi"
import { StarCuteReIcon } from "@/src/icons/star_cute_re"
import { Translate2CuteReIcon } from "@/src/icons/translate_2_cute_re"
import { VoiceCuteReIcon } from "@/src/icons/voice_cute_re"
import { hideIntelligenceGlowEffect, openLink } from "@/src/lib/native"
import { useNavigation } from "@/src/lib/navigation/hooks"
import { createLinkShareContent } from "@/src/lib/share"
import { toast } from "@/src/lib/toast"
import { showUpgradeRequiredDialog } from "@/src/modules/dialogs/UpgradeRequiredDialog"
import { playEntryTts } from "@/src/modules/player/entry-tts"
import { getSelectedView } from "@/src/modules/screen/atoms"
import { ReadingScreen } from "@/src/modules/settings/routes/Reading"

import { useEntryContentContext } from "./ctx"
import { useEntryExternalUrl } from "./external-url"

type ActionItem = {
  key: string
  title: string
  icon: React.JSX.Element
  iconIOS: MenuItemIconProps["ios"]
  onPress: () => void
  active?: boolean
  iconColor?: string
  isCheckbox?: boolean
  inMenu?: boolean
}

export function EntryContentHeaderRightActions(props: HeaderRightActionsProps) {
  return <HeaderRightActionsImpl {...props} />
}

interface HeaderRightActionsProps {
  entryId: string
  titleOpacityShareValue: SharedValue<number>
  isHeaderTitleVisible: boolean
}

const HeaderRightActionsImpl = ({
  entryId,
  titleOpacityShareValue,
  isHeaderTitleVisible,
}: HeaderRightActionsProps) => {
  const { t } = useTranslation()
  const { t: tSettings } = useTranslation("settings")
  const navigation = useNavigation()
  const labelColor = useColor("label")
  const isLoggedIn = useIsLoggedIn()
  const isStarred = useIsEntryStarred(entryId)
  const [extraActionContainerWidth, setExtraActionContainerWidth] = useState(0)

  const entry = useEntry(
    entryId,
    (entry) =>
      entry && {
        feedId: entry.feedId,
        title: entry.title,
        settings: entry.settings,
      },
  )
  // Onboarding entries have no link outside the app, and relative links resolve first
  const externalUrl = useEntryExternalUrl(entryId)

  const { showReadabilityAtom, showAITranslationAtom } = useEntryContentContext()
  const [showTranslation, setShowTranslation] = useAtom(showAITranslationAtom)
  const [showReadability, setShowReadability] = useAtom(showReadabilityAtom)
  const translationSetting = useGeneralSettingKey("translation")
  const userRole = useUserRole()
  // Free plans don't include AI translation, so neither the setting nor an action translates
  const isTranslationLocked = userRole === UserRole.Free || userRole === UserRole.Trial
  const showAITranslationSetting =
    !isTranslationLocked && (translationSetting || !!entry?.settings?.translation)
  const translationMode = useGeneralSettingKey("translationMode")
  const showReadabilitySetting = !!entry?.settings?.readability

  const feed = useFeedById(entry?.feedId as string, (feed) => feed && { feedId: feed.id })
  const subscription = useSubscriptionById(feed?.feedId as string)

  const handleToggleStar = () => {
    if (!entry) return

    isStarred
      ? collectionSyncService.unstarEntry({ entryId })
      : collectionSyncService.starEntry({
          entryId,
          // An entry read through a list, a preview or an unfollowed feed has no subscription,
          // so it is starred in the view it was opened from
          view: subscription?.view ?? getSelectedView() ?? FeedViewType.Articles,
        })
  }

  const handleShare = () => {
    if (!externalUrl) return
    Share.share(
      createLinkShareContent({
        platform: Platform.OS,
        // Social posts often have no title
        title: entry?.title || t("operation.share_title.link"),
        url: externalUrl,
      }),
    )
  }

  const toggleAITranslation = () => {
    if (isTranslationLocked) {
      showUpgradeRequiredDialog({
        title: tSettings("general.action.translation.label"),
        message: tSettings("control.paid_badge.basic_or_higher"),
      })
      return
    }
    translationSyncService.generateTranslation({
      entryId,
      language: getActionLanguage(),
      withContent: true,
      target: showReadability ? "readabilityContent" : "content",
      mode: translationMode,
    })
    setShowTranslation((prev) => !prev)
  }

  const toggleReadability = useCallback(() => {
    entrySyncServices.fetchEntryReadabilityContent(entryId)
    setShowReadability((prev) => !prev)
  }, [entryId, setShowReadability])

  const handleCopyLink = () => {
    if (!externalUrl) return
    setStringAsync(externalUrl)
    toast.success(t("operation.copy_which_success", { which: t("operation.copy.link") }))
  }

  const handleOpenInBrowser = () => {
    if (!externalUrl) return
    openLink(externalUrl)
  }

  useEffect(() => {
    return () => hideIntelligenceGlowEffect()
  }, [])

  // Define action items for reuse
  const actionItems = [
    isLoggedIn &&
      !!entry && {
        key: "Star",
        title: isStarred ? t("operation.unstar") : t("operation.star"),
        icon: isStarred ? <StarCuteFiIcon /> : <StarCuteReIcon />,
        iconIOS: {
          name: isStarred ? "star.fill" : "star",
          paletteColors: isStarred ? ["#facc15"] : undefined,
        },
        onPress: handleToggleStar,
        active: isStarred,
        iconColor: isStarred ? "#facc15" : undefined,
      },
    !showReadabilitySetting && {
      key: "ShowReadability",
      title: t("entry_content.header.show_readability"),
      icon: <DocmentCuteReIcon />,
      iconIOS: { name: "doc.text" },
      onPress: toggleReadability,
      active: showReadability,
      isCheckbox: true,
      // inMenu: true,
    },
    isLoggedIn &&
      !showAITranslationSetting && {
        key: "ShowTranslation",
        title: t("entry_content.header.show_translation"),
        icon: <Translate2CuteReIcon />,
        iconIOS: { name: "globe" },
        onPress: toggleAITranslation,
        active: showTranslation && !isTranslationLocked,
        isCheckbox: true,
        inMenu: true,
      },
    {
      key: "PlayTts",
      title: t("entry_content.header.play_tts"),
      icon: <VoiceCuteReIcon />,
      iconIOS: { name: "speaker.wave.2" },
      onPress: () => {
        void playEntryTts(entryId, {
          preferReadability: showReadability,
          toastTitle: t("entry_content.header.play_tts"),
        })
      },
      inMenu: true,
    },
    !!externalUrl && {
      key: "Share",
      title: t("operation.share"),
      icon: <ShareForwardCuteReIcon />,
      iconIOS: { name: "square.and.arrow.up" },
      onPress: handleShare,
    },
    !!externalUrl && {
      key: "CopyLink",
      title: t("operation.copy_which", { which: t("operation.copy.link") }),
      iconIOS: { name: "link" },
      onPress: handleCopyLink,
      inMenu: true,
    },
    !!externalUrl && {
      key: "OpenInBrowser",
      title: t("entry_content.header.open_in_browser"),
      iconIOS: { name: "safari" },
      onPress: handleOpenInBrowser,
      inMenu: true,
    },
    {
      key: "ReadingSettings",
      title: t("entry_content.header.reading_settings"),
      iconIOS: { name: "textformat.size" },
      onPress: () => {
        navigation.pushControllerView(ReadingScreen)
      },
      inMenu: true,
    },
  ].filter(Boolean) as ActionItem[]

  return (
    <View className="relative flex-row gap-4">
      {!isHeaderTitleVisible && (
        <View style={{ width: extraActionContainerWidth }} pointerEvents="none" />
      )}

      <Animated.View
        onLayout={(e) => setExtraActionContainerWidth(e.nativeEvent.layout.width)}
        style={useAnimatedStyle(() => ({
          opacity: interpolate(titleOpacityShareValue.value, [0, 1], [1, 0]),
        }))}
        className="absolute right-[32px] z-10 flex-row gap-2"
        // Faded out once the title shows in the header, where Android would still let them be
        // tapped and screen readers would still find them
        pointerEvents={isHeaderTitleVisible ? "none" : "box-none"}
        accessibilityElementsHidden={isHeaderTitleVisible}
        importantForAccessibility={isHeaderTitleVisible ? "no-hide-descendants" : "auto"}
      >
        {actionItems
          .filter((item) => !item.inMenu)
          .map(
            (item) =>
              item && (
                <ActionBarItem
                  key={item.key}
                  onPress={item.onPress}
                  label={item.title}
                  active={item.active}
                  iconColor={item.iconColor}
                >
                  {item.icon}
                </ActionBarItem>
              ),
          )}
      </Animated.View>

      <DropdownMenu.Root>
        <DropdownMenu.Trigger>
          <Pressable
            testID="entry-more-actions"
            hitSlop={10}
            accessibilityLabel={t("entry_content.header.more_actions")}
          >
            <More1CuteReIcon color={labelColor} />
          </Pressable>
        </DropdownMenu.Trigger>

        <DropdownMenu.Content>
          {actionItems
            .filter((item) => (isHeaderTitleVisible ? true : item?.inMenu))
            .map(
              (item) =>
                item &&
                (item.isCheckbox ? (
                  <DropdownMenu.CheckboxItem
                    key={item.key}
                    value={item.active!}
                    onSelect={item.onPress}
                  >
                    <DropdownMenu.ItemTitle>{item.title}</DropdownMenu.ItemTitle>
                    <DropdownMenu.ItemIcon ios={item.iconIOS} />
                  </DropdownMenu.CheckboxItem>
                ) : (
                  <DropdownMenu.Item key={item.key} onSelect={item.onPress}>
                    <DropdownMenu.ItemTitle>{item.title}</DropdownMenu.ItemTitle>
                    <DropdownMenu.ItemIcon ios={item.iconIOS} />
                  </DropdownMenu.Item>
                )),
            )}
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </View>
  )
}

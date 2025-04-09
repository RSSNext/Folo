import { useAtom } from "jotai"
import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Clipboard, Share, TouchableOpacity, View } from "react-native"
import type { SharedValue } from "react-native-reanimated"
import Animated, { interpolate, useAnimatedStyle } from "react-native-reanimated"
import { useColor } from "react-native-uikit-colors"
import type { MenuItemIconProps } from "zeego/lib/typescript/menu"

import { getGeneralSettings, useGeneralSettingKey } from "@/src/atoms/settings/general"
import { ActionBarItem } from "@/src/components/ui/action-bar/ActionBarItem"
import { DropdownMenu } from "@/src/components/ui/context-menu"
import { DocmentCuteReIcon } from "@/src/icons/docment_cute_re"
import { Magic2CuteReIcon } from "@/src/icons/magic_2_cute_re"
import { More1CuteReIcon } from "@/src/icons/more_1_cute_re"
import { Share3CuteReIcon } from "@/src/icons/share_3_cute_re"
import { StarCuteFiIcon } from "@/src/icons/star_cute_fi"
import { StarCuteReIcon } from "@/src/icons/star_cute_re"
import { Translate2CuteReIcon } from "@/src/icons/translate_2_cute_re"
import type { SupportedLanguages } from "@/src/lib/language"
import { hideIntelligenceGlowEffect, openLink, showIntelligenceGlowEffect } from "@/src/lib/native"
import { toast } from "@/src/lib/toast"
import { useIsEntryStarred } from "@/src/store/collection/hooks"
import { collectionSyncService } from "@/src/store/collection/store"
import { useEntry } from "@/src/store/entry/hooks"
import { entrySyncServices } from "@/src/store/entry/store"
import { useFeed } from "@/src/store/feed/hooks"
import { useSubscription } from "@/src/store/subscription/hooks"
import { summaryActions, summarySyncService } from "@/src/store/summary/store"
import { translationSyncService } from "@/src/store/translation/store"

import { useEntryContentContext } from "./ctx"

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
  const labelColor = useColor("label")
  const isStarred = useIsEntryStarred(entryId)
  const [extraActionContainerWidth, setExtraActionContainerWidth] = useState(0)

  const entry = useEntry(
    entryId,
    (entry) =>
      entry && {
        url: entry.url,
        feedId: entry.feedId,
        title: entry.title,
        settings: entry.settings,
      },
  )

  const { showAISummaryAtom, showReadabilityAtom, showAITranslationAtom } = useEntryContentContext()
  const [showAISummary, setShowAISummary] = useAtom(showAISummaryAtom)
  const [showTranslation, setShowTranslation] = useAtom(showAITranslationAtom)
  const [showReadability, setShowReadability] = useAtom(showReadabilityAtom)
  const showAISummarySetting = useGeneralSettingKey("summary") || !!entry?.settings?.summary
  const showAITranslationSetting =
    useGeneralSettingKey("translation") || !!entry?.settings?.translation

  const feed = useFeed(entry?.feedId as string, (feed) => feed && { feedId: feed.id })
  const subscription = useSubscription(feed?.feedId as string)

  const handleToggleStar = () => {
    if (!entry || !feed || !subscription) return

    isStarred
      ? collectionSyncService.unstarEntry(entryId)
      : collectionSyncService.starEntry({
          entryId,
          feedId: feed.feedId,
          view: subscription.view,
        })
  }

  const handleShare = () => {
    if (!entry?.title || !entry?.url) return
    Share.share({ title: entry.title, url: entry.url })
  }

  const toggleAISummary = () => {
    if (!entry) return

    const getCachedOrGenerateSummary = async () => {
      const hasSummary = summaryActions.getSummary(entryId)
      if (hasSummary) return

      const hideGlowEffect = showIntelligenceGlowEffect()
      await summarySyncService.generateSummary(entryId)
      hideGlowEffect()
    }

    setShowAISummary((prev) => {
      const newValue = !prev
      if (newValue) getCachedOrGenerateSummary()
      return newValue
    })
  }

  const toggleAITranslation = () => {
    translationSyncService.generateTranslation(
      entryId,
      getGeneralSettings().actionLanguage as SupportedLanguages,
    )
    setShowTranslation((prev) => !prev)
  }

  const toggleReadability = useCallback(() => {
    entrySyncServices.fetchEntryReadabilityContent(entryId)
    setShowReadability((prev) => !prev)
  }, [entryId, setShowReadability])

  const handleCopyLink = () => {
    if (!entry?.url) return
    Clipboard.setString(entry.url)
    toast.success("Link copied to clipboard")
  }

  const handleOpenInBrowser = () => {
    if (!entry?.url) return
    openLink(entry.url)
  }

  useEffect(() => {
    return () => hideIntelligenceGlowEffect()
  }, [])

  // Define action items for reuse
  const actionItems = [
    subscription && {
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
    {
      key: "ShowReadability",
      title: "Show Readability",
      icon: <DocmentCuteReIcon />,
      iconIOS: { name: "doc.text" },
      onPress: toggleReadability,
      active: showReadability,
      isCheckbox: true,
      inMenu: true,
    },
    !showAISummarySetting && {
      key: "GenerateSummary",
      title: "Generate Summary",
      icon: <Magic2CuteReIcon />,
      iconIOS: { name: "sparkles" },
      onPress: toggleAISummary,
      active: showAISummary,
      isCheckbox: true,
      inMenu: true,
    },
    !showAITranslationSetting && {
      key: "ShowTranslation",
      title: "Show Translation",
      icon: <Translate2CuteReIcon />,
      iconIOS: { name: "globe" },
      onPress: toggleAITranslation,
      active: showTranslation,
      isCheckbox: true,
      inMenu: true,
    },
    {
      key: "Share",
      title: t("operation.share"),
      icon: <Share3CuteReIcon />,
      iconIOS: { name: "square.and.arrow.up" },
      onPress: handleShare,
    },
    {
      key: "CopyLink",
      title: t("operation.copy_link"),
      iconIOS: { name: "link" },
      onPress: handleCopyLink,
      inMenu: true,
    },
    {
      key: "OpenInBrowser",
      title: "Open in Browser",
      iconIOS: { name: "safari" },
      onPress: handleOpenInBrowser,
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
          <TouchableOpacity hitSlop={10} accessibilityLabel="More Actions">
            <More1CuteReIcon color={labelColor} />
          </TouchableOpacity>
        </DropdownMenu.Trigger>

        <DropdownMenu.Content>
          {isHeaderTitleVisible && (
            <DropdownMenu.Group>
              {actionItems.map(
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
            </DropdownMenu.Group>
          )}
          {actionItems
            .filter((item) => item?.inMenu)
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

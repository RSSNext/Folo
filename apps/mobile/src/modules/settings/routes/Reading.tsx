import type { ReaderTextColorPreset } from "@follow/shared/settings/reader-style"
import {
  READER_FONT_PRESETS,
  READER_LINE_HEIGHT_PRESETS,
  READER_TEXT_COLOR_PRESETS,
} from "@follow/shared/settings/reader-style"
import { themeNames } from "@shikijs/themes"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useColorScheme } from "react-native"

import { setUISetting, useUIPaidSettingLocked, useUISettingKey } from "@/src/atoms/settings/ui"
import {
  NavigationBlurEffectHeaderView,
  SafeNavigationScrollView,
} from "@/src/components/layouts/views/SafeNavigationScrollView"
import { Select } from "@/src/components/ui/form/Select"
import {
  GroupedInsetListCard,
  GroupedInsetListCell,
  GroupedInsetListSectionHeader,
} from "@/src/components/ui/grouped/GroupedList"
import { Switch } from "@/src/components/ui/switch/Switch"
import type { NavigationControllerView } from "@/src/lib/navigation/types"

import { PaidSettingCell } from "../components/PaidSettingCell"

const selectWrapperClassName = "w-auto min-w-[96px] max-w-[44vw] shrink-0"

/**
 * Reading view preferences: typography, immersive reading and content rendering.
 * Reachable from Settings > Appearance and from the entry "more" menu.
 */
export const ReadingScreen: NavigationControllerView = () => {
  const { t } = useTranslation("settings")
  const colorScheme = useColorScheme()

  const readerFontFamily = useUISettingKey("readerFontFamily")
  const contentLineHeight = useUISettingKey("contentLineHeight")
  const readerTextColor = useUISettingKey("readerTextColor")
  const autoHideReaderHeader = useUISettingKey("autoHideReaderHeader")
  const readerRenderInlineStyle = useUISettingKey("readerRenderInlineStyle")
  const hideRecentReader = useUISettingKey("hideRecentReader")
  const isHideRecentReaderLocked = useUIPaidSettingLocked("hideRecentReader")
  const codeThemeLight = useUISettingKey("codeHighlightThemeLight")
  const codeThemeDark = useUISettingKey("codeHighlightThemeDark")

  // Values synced from other clients may not match a preset, keep them selectable.
  const fontOptions = useMemo(() => {
    const options = READER_FONT_PRESETS.map((preset) => ({
      label: t(`appearance.reader_font.${preset.key}`),
      value: preset.value,
    }))
    const currentFont = readerFontFamily || "inherit"
    if (!options.some((option) => option.value === currentFont)) {
      options.push({ label: currentFont, value: currentFont })
    }
    return options
  }, [readerFontFamily, t])

  const lineHeightOptions = useMemo(() => {
    const options = READER_LINE_HEIGHT_PRESETS.map((preset) => ({
      label: t(`appearance.content_line_height.${preset.key}`),
      value: preset.value.toString(),
    }))
    const currentLineHeight = contentLineHeight.toString()
    if (!options.some((option) => option.value === currentLineHeight)) {
      options.push({ label: currentLineHeight, value: currentLineHeight })
    }
    return options
  }, [contentLineHeight, t])

  const textColorOptions = useMemo(
    () =>
      READER_TEXT_COLOR_PRESETS.map((preset) => ({
        label: t(`appearance.reader_text_color.${preset}`),
        value: preset,
      })),
    [t],
  )

  return (
    <SafeNavigationScrollView
      className="bg-system-grouped-background"
      Header={<NavigationBlurEffectHeaderView title={t("appearance.reading.title")} />}
    >
      <GroupedInsetListSectionHeader label={t("appearance.typography.title")} marginSize="small" />
      <GroupedInsetListCard>
        <GroupedInsetListCell
          label={t("appearance.content_font.label")}
          description={t("appearance.content_font.description")}
        >
          <Select
            wrapperClassName={selectWrapperClassName}
            options={fontOptions}
            value={readerFontFamily || "inherit"}
            onValueChange={(val) => {
              setUISetting("readerFontFamily", val)
            }}
          />
        </GroupedInsetListCell>
        <GroupedInsetListCell
          label={t("appearance.content_line_height.label")}
          description={t("appearance.content_line_height.description")}
        >
          <Select
            wrapperClassName={selectWrapperClassName}
            options={lineHeightOptions}
            value={contentLineHeight.toString()}
            onValueChange={(val) => {
              const next = Number.parseFloat(val)
              if (!Number.isNaN(next)) {
                setUISetting("contentLineHeight", next)
              }
            }}
          />
        </GroupedInsetListCell>
        <GroupedInsetListCell
          label={t("appearance.reader_text_color.label")}
          description={t("appearance.reader_text_color.description")}
        >
          <Select
            wrapperClassName={selectWrapperClassName}
            options={textColorOptions}
            value={readerTextColor}
            onValueChange={(val) => {
              setUISetting("readerTextColor", val as ReaderTextColorPreset)
            }}
          />
        </GroupedInsetListCell>
      </GroupedInsetListCard>

      <GroupedInsetListSectionHeader label={t("appearance.reading_view.title")} />
      <GroupedInsetListCard>
        <GroupedInsetListCell
          label={t("appearance.auto_hide_reader_header.label")}
          description={t("appearance.auto_hide_reader_header.description")}
        >
          <Switch
            size="sm"
            value={autoHideReaderHeader}
            onValueChange={(val) => {
              setUISetting("autoHideReaderHeader", val)
            }}
          />
        </GroupedInsetListCell>
        <GroupedInsetListCell
          label={t("appearance.reader_render_inline_style.label")}
          description={t("appearance.reader_render_inline_style.description")}
        >
          <Switch
            size="sm"
            value={readerRenderInlineStyle}
            onValueChange={(val) => {
              setUISetting("readerRenderInlineStyle", val)
            }}
          />
        </GroupedInsetListCell>
      </GroupedInsetListCard>

      <GroupedInsetListSectionHeader label={t("appearance.code_highlighting.title")} />
      <GroupedInsetListCard>
        <GroupedInsetListCell
          label={t("appearance.code_highlight_theme.label")}
          description={t("appearance.code_highlight_theme.description")}
        >
          <Select
            wrapperClassName={selectWrapperClassName}
            options={themeNames.map((theme) => ({
              label: theme,
              value: theme,
            }))}
            value={colorScheme === "dark" ? codeThemeDark : codeThemeLight}
            onValueChange={(val) => {
              setUISetting(`codeHighlightTheme${colorScheme === "dark" ? "Dark" : "Light"}`, val)
            }}
          />
        </GroupedInsetListCell>
      </GroupedInsetListCard>

      <GroupedInsetListSectionHeader label={t("appearance.misc")} />
      <GroupedInsetListCard>
        <PaidSettingCell
          label={t("appearance.hide_recent_reader.label")}
          description={t("appearance.hide_recent_reader.description")}
          locked={isHideRecentReaderLocked}
        >
          <Switch
            size="sm"
            value={hideRecentReader}
            disabled={isHideRecentReaderLocked}
            onValueChange={(val) => {
              setUISetting("hideRecentReader", val)
            }}
          />
        </PaidSettingCell>
      </GroupedInsetListCard>
    </SafeNavigationScrollView>
  )
}

import { useMobile } from "@follow/components/hooks/useMobile.js"
import { Button } from "@follow/components/ui/button/index.js"
import { LoadingCircle } from "@follow/components/ui/loading/index.js"
import { Popover, PopoverContent, PopoverTrigger } from "@follow/components/ui/popover/index.js"
import { ResponsiveSelect } from "@follow/components/ui/select/responsive.js"
import { useIsDark, useThemeAtomValue } from "@follow/hooks"
import { ELECTRON_BUILD, IN_ELECTRON } from "@follow/shared/constants"
import { getAccentColorValue } from "@follow/shared/settings/constants"
import type { AccentColor } from "@follow/shared/settings/interface"
import { capitalizeFirstLetter, getOS } from "@follow/utils/utils"
import dayjs from "dayjs"
import { throttle } from "es-toolkit/compat"
import { useForceUpdate } from "motion/react"
import {
  lazy,
  startTransition,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { useTranslation } from "react-i18next"
import { bundledThemesInfo } from "shiki/themes"

import {
  getUISettings,
  setUISetting,
  useUISettingKey,
  useUISettingSelector,
  useUISettingValue,
} from "~/atoms/settings/ui"
import { useCurrentModal, useModalStack } from "~/components/ui/modal/stacked/hooks"
import { useSetTheme } from "~/hooks/common"
import { useShowCustomizeToolbarModal } from "~/modules/customize-toolbar/modal"

import { useShowTimelineTabsSettingsModal } from "../../subscription-column/TimelineTabsSettingsModal"
import { SETTING_MODAL_ID } from "../constants"
import { SettingActionItem, SettingDescription, SettingTabbedSegment } from "../control"
import { createDefineSettingItem } from "../helper/builder"
import { createSettingBuilder } from "../helper/setting-builder"
import {
  useWrapEnhancedSettingItem,
  WrapEnhancedSettingTab,
} from "../hooks/useWrapEnhancedSettingItem"
import { SettingItemGroup } from "../section"
import { ContentFontSelector, UIFontSelector } from "../sections/fonts"

const SettingBuilder = createSettingBuilder(useUISettingValue)
const _defineItem = createDefineSettingItem("ui", useUISettingValue, setUISetting)

export const SettingAppearance = () => {
  const { t } = useTranslation("settings")
  const isMobile = useMobile()
  const defineItem = useWrapEnhancedSettingItem(_defineItem, WrapEnhancedSettingTab.Appearance)
  return (
    <div className="mt-4">
      <SettingBuilder
        settings={[
          {
            type: "title",
            value: t("appearance.common.title"),
          },

          // Top Level - Most Common
          AppThemeSegment,
          AccentColorSelector,
          GlobalFontSize,
          UIFontSelector,
          ContentLineHeight,

          {
            type: "title",
            value: t("appearance.subscription_list.title"),
          },

          defineItem("sidebarShowUnreadCount", {
            label: t("appearance.unread_count.sidebar.title"),
            description: t("appearance.unread_count.sidebar.description"),
          }),
          defineItem("hideExtraBadge", {
            label: t("appearance.hide_extra_badge.label"),
            description: t("appearance.hide_extra_badge.description"),
            hide: isMobile,
          }),
          {
            type: "title",
            value: t("appearance.reading_view.title"),
          },

          {
            type: "title",
            value: t("appearance.interface_window.title"),
          },

          defineItem("opaqueSidebar", {
            label: t("appearance.opaque_sidebars.label"),
            description: t("appearance.opaque_sidebars.description"),
            hide: !window.api?.canWindowBlur || isMobile,
          }),

          defineItem("modalOverlay", {
            label: t("appearance.modal_overlay.label"),
            description: t("appearance.modal_overlay.description"),
            hide: isMobile,
          }),

          defineItem("reduceMotion", {
            label: t("appearance.reduce_motion.label"),
            description: t("appearance.reduce_motion.description"),
          }),

          defineItem("usePointerCursor", {
            label: t("appearance.use_pointer_cursor.label"),
            description: t("appearance.use_pointer_cursor.description"),
            hide: isMobile,
          }),

          {
            type: "title",
            value: t("appearance.system_integration.title"),
          },

          defineItem("showDockBadge", {
            label: t("appearance.unread_count.badge.label"),
            description: t("appearance.unread_count.badge.description"),
            hide: !IN_ELECTRON || !["macOS", "Linux"].includes(getOS()) || isMobile,
          }),

          {
            type: "title",
            value: t("appearance.typography.title"),
          },

          ContentFontSelector,

          {
            type: "title",
            value: t("appearance.content_display.title"),
          },

          ThumbnailRatio,
          DateFormat,

          defineItem("hideRecentReader", {
            label: t("appearance.hide_recent_reader.label"),
            description: t("appearance.hide_recent_reader.description"),
          }),
          defineItem("readerRenderInlineStyle", {
            label: t("appearance.reader_render_inline_style.label"),
            description: t("appearance.reader_render_inline_style.description"),
          }),

          {
            type: "title",
            value: t("appearance.code_highlighting.title"),
          },

          ShikiTheme,

          defineItem("guessCodeLanguage", {
            label: t("appearance.guess_code_language.label"),
            hide: !ELECTRON_BUILD,
            description: t("appearance.guess_code_language.description"),
          }),

          {
            type: "title",
            value: t("appearance.customization.title"),
          },

          CustomCSS,
          CustomizeToolbar,
          CustomizeSubscriptionTabs,
        ]}
      />
    </div>
  )
}

const ShikiTheme = () => {
  const { t } = useTranslation("settings")
  const isMobile = useMobile()
  const isDark = useIsDark()
  const codeHighlightThemeLight = useUISettingKey("codeHighlightThemeLight")
  const codeHighlightThemeDark = useUISettingKey("codeHighlightThemeDark")

  return (
    <SettingItemGroup>
      <div className="mt-4 flex items-center justify-between">
        <span className="shrink-0 text-sm font-medium">
          {t("appearance.code_highlight_theme.label")}
        </span>

        <ResponsiveSelect
          items={bundledThemesInfo
            .filter((theme) => theme.type === (isDark ? "dark" : "light"))
            .map((theme) => ({ value: theme.id, label: theme.displayName }))}
          value={isDark ? codeHighlightThemeDark : codeHighlightThemeLight}
          onValueChange={(value) => {
            if (isDark) {
              setUISetting("codeHighlightThemeDark", value)
            } else {
              setUISetting("codeHighlightThemeLight", value)
            }
          }}
          triggerClassName="w-48"
          renderItem={(item) =>
            isMobile ? (
              capitalizeFirstLetter(item.label)
            ) : (
              <span className="capitalize">{item.label}</span>
            )
          }
          size="sm"
        />
      </div>
      <SettingDescription>{t("appearance.code_highlight_theme.description")}</SettingDescription>
    </SettingItemGroup>
  )
}

const textSizeMap = {
  smaller: 15,
  default: 16,
  medium: 18,
  large: 20,
}

export const TextSize = () => {
  const { t } = useTranslation("settings")
  const uiTextSize = useUISettingSelector((state) => state.uiTextSize)

  return (
    <div className="mb-3 flex items-center justify-between">
      <span className="shrink-0 text-sm font-medium">{t("appearance.text_size.label")}</span>
      <ResponsiveSelect
        defaultValue={textSizeMap.default.toString()}
        value={uiTextSize.toString() || textSizeMap.default.toString()}
        onValueChange={(value) => {
          setUISetting("uiTextSize", Number.parseInt(value) || textSizeMap.default)
        }}
        size="sm"
        triggerClassName="w-48 capitalize"
        items={Object.entries(textSizeMap).map(([size, value]) => ({
          label: t(`appearance.text_size.${size as keyof typeof textSizeMap}`),
          value: value.toString(),
        }))}
      />
    </div>
  )
}

// Global Font Size component that combines UI and content font size
const GlobalFontSize = () => {
  const { t } = useTranslation("settings")
  const uiTextSize = useUISettingSelector((state) => state.uiTextSize)

  return (
    <SettingItemGroup>
      <div className="mt-4 flex items-center justify-between">
        <span className="shrink-0 text-sm font-medium">
          {t("appearance.global_font_size.label")}
        </span>

        <ResponsiveSelect
          defaultValue={textSizeMap.default.toString()}
          value={uiTextSize.toString() || textSizeMap.default.toString()}
          onValueChange={(value) => {
            const size = Number.parseInt(value) || textSizeMap.default
            setUISetting("uiTextSize", size)
            // Also update content font size to keep them in sync
            setUISetting("contentFontSize", size)
          }}
          size="sm"
          triggerClassName="w-48 capitalize"
          items={Object.entries(textSizeMap).map(([size, value]) => ({
            label: t(`appearance.text_size.${size as keyof typeof textSizeMap}`),
            value: value.toString(),
          }))}
        />
      </div>
      <SettingDescription>{t("appearance.global_font_size.description")}</SettingDescription>
    </SettingItemGroup>
  )
}

export const AppThemeSegment = () => {
  const { t } = useTranslation("settings")
  const theme = useThemeAtomValue()
  const setTheme = useSetTheme()

  return (
    <SettingTabbedSegment
      key="theme"
      label={t("appearance.theme.label")}
      description={t("appearance.theme.description")}
      value={theme}
      values={[
        {
          value: "system",
          label: t("appearance.theme.system"),
          icon: <i className="i-mingcute-monitor-line" />,
        },
        {
          value: "light",
          label: t("appearance.theme.light"),
          icon: <i className="i-mingcute-sun-line" />,
        },
        {
          value: "dark",
          label: t("appearance.theme.dark"),
          icon: <i className="i-mingcute-moon-line" />,
        },
      ]}
      onValueChanged={(value) => {
        setTheme(value as "light" | "dark" | "system")
      }}
    />
  )
}

const ThumbnailRatio = () => {
  const { t } = useTranslation("settings")

  const thumbnailRatio = useUISettingKey("thumbnailRatio")

  return (
    <SettingItemGroup>
      <div className="mt-4 flex items-center justify-between">
        <span className="shrink-0 text-sm font-medium">
          {t("appearance.thumbnail_ratio.title")}
        </span>

        <ResponsiveSelect
          items={[
            { value: "square", label: t("appearance.thumbnail_ratio.square") },
            { value: "original", label: t("appearance.thumbnail_ratio.original") },
          ]}
          value={thumbnailRatio}
          onValueChange={(value) => {
            setUISetting("thumbnailRatio", value as "square" | "original")
          }}
          renderValue={(item) =>
            t(`appearance.thumbnail_ratio.${item.value as "square" | "original"}`)
          }
          triggerClassName="w-48 lg:translate-y-2 -inset-8translate-y-1"
          size="sm"
        />
      </div>
      <SettingDescription>{t("appearance.thumbnail_ratio.description")}</SettingDescription>
    </SettingItemGroup>
  )
}

const CustomCSS = () => {
  const { t } = useTranslation("settings")
  const { present } = useModalStack()
  return (
    <>
      <SettingActionItem
        label={t("appearance.custom_css.label")}
        action={() => {
          present({
            title: t("appearance.custom_css.label"),
            content: CustomCSSModal,
            clickOutsideToDismiss: false,
            overlay: false,
            resizeable: true,
            resizeDefaultSize: {
              width: 700,
              height: window.innerHeight - 200,
            },
          })
        }}
        buttonText={t("appearance.custom_css.button")}
      />
      <SettingDescription className="-mt-3">
        {t("appearance.custom_css.description")}
      </SettingDescription>
    </>
  )
}
const LazyCSSEditor = lazy(() =>
  import("../../editor/css-editor").then((m) => ({ default: m.CSSEditor })),
)

const CustomCSSModal = () => {
  const initialCSS = useRef(getUISettings().customCSS)
  const { t } = useTranslation("common")
  const { dismiss } = useCurrentModal()
  useEffect(() => {
    return () => {
      setUISetting("customCSS", initialCSS.current)
    }
  }, [])
  useEffect(() => {
    const modal = document.querySelector(`#${SETTING_MODAL_ID}`) as HTMLDivElement
    if (!modal) return
    const prevOverlay = getUISettings().modalOverlay
    setUISetting("modalOverlay", false)

    modal.style.display = "none"
    return () => {
      setUISetting("modalOverlay", prevOverlay)

      modal.style.display = ""
    }
  }, [])
  const [forceUpdate, key] = useForceUpdate()
  return (
    <form
      className="relative flex h-full max-w-full flex-col"
      onSubmit={(e) => {
        e.preventDefault()
        if (initialCSS.current !== getUISettings().customCSS) {
          initialCSS.current = getUISettings().customCSS
        }
        dismiss()
      }}
    >
      <Suspense
        fallback={
          <div className="center flex grow lg:h-0">
            <LoadingCircle size="large" />
          </div>
        }
      >
        <LazyCSSEditor
          defaultValue={initialCSS.current}
          key={key}
          className="h-[70vh] grow rounded-lg border p-3 font-mono lg:h-0"
          onChange={(value) => {
            setUISetting("customCSS", value)
          }}
        />
      </Suspense>

      <div className="mt-2 flex shrink-0 justify-end gap-2">
        <Button
          variant="outline"
          onClick={(e) => {
            e.preventDefault()

            setUISetting("customCSS", initialCSS.current)

            forceUpdate()
          }}
        >
          {t("words.reset")}
        </Button>
        <Button type="submit">{t("words.save")}</Button>
      </div>
    </form>
  )
}

const ContentLineHeight = () => {
  const { t } = useTranslation("settings")
  const contentLineHeight = useUISettingKey("contentLineHeight")
  return (
    <SettingItemGroup>
      <div className="mt-4 flex items-center justify-between">
        <span className="shrink-0 text-sm font-medium">
          {t("appearance.content_line_height.label")}
        </span>

        <ResponsiveSelect
          items={[
            { value: "1.25", label: t("appearance.content_line_height.tight") },
            { value: "1.375", label: t("appearance.content_line_height.snug") },
            { value: "1.5", label: t("appearance.content_line_height.normal") },
            { value: "1.75", label: t("appearance.content_line_height.relaxed") },
            { value: "2", label: t("appearance.content_line_height.loose") },
          ]}
          value={contentLineHeight.toString()}
          onValueChange={(value) => {
            setUISetting("contentLineHeight", Number.parseFloat(value))
          }}
          triggerClassName="w-48"
          size="sm"
        />
      </div>
      <SettingDescription>{t("appearance.content_line_height.description")}</SettingDescription>
    </SettingItemGroup>
  )
}

const DateFormat = () => {
  const { t } = useTranslation("settings")
  const { t: commonT } = useTranslation("common")
  const dateFormat = useUISettingKey("dateFormat")
  const [date] = useState(() => new Date())

  const generateItem = (format: string) => ({
    value: format,
    label: dayjs(date).format(format),
  })
  return (
    <SettingItemGroup>
      <div className="mt-4 flex items-center justify-between">
        <span className="shrink-0 text-sm font-medium">{t("appearance.date_format.label")}</span>

        <ResponsiveSelect
          items={[
            { value: "default", label: commonT("words.default") },
            generateItem("MM/DD/YY HH:mm"),
            generateItem("DD/MM/YYYY HH:mm"),

            generateItem("L"),
            generateItem("LTS"),
            generateItem("LT"),
            generateItem("LLLL"),
            generateItem("LL"),
            generateItem("LLL"),
          ]}
          value={dateFormat}
          onValueChange={(value) => {
            setUISetting("dateFormat", value)
          }}
          triggerClassName="w-48"
          size="sm"
        />
      </div>
      <SettingDescription>{t("appearance.date_format.description")}</SettingDescription>
    </SettingItemGroup>
  )
}

/**
 * @description customize the toolbar actions
 */
const CustomizeToolbar = () => {
  const { t } = useTranslation("settings")
  const showModal = useShowCustomizeToolbarModal()

  return (
    <SettingItemGroup>
      <SettingActionItem
        label={t("appearance.customize_toolbar.label")}
        action={async () => {
          showModal()
        }}
        buttonText={t("appearance.words.customize")}
      />
      <SettingDescription className="-mt-3">
        {t("appearance.customize_toolbar.description")}
      </SettingDescription>
    </SettingItemGroup>
  )
}

const CustomizeSubscriptionTabs = () => {
  const { t } = useTranslation("settings")
  const showTabsModal = useShowTimelineTabsSettingsModal()
  return (
    <SettingItemGroup>
      <SettingActionItem
        label={t("appearance.customize_sub_tabs.label")}
        action={() => showTabsModal()}
        buttonText={t("appearance.words.customize")}
      />
      <SettingDescription className="-mt-3">
        {t("appearance.customize_sub_tabs.description")}
      </SettingDescription>
    </SettingItemGroup>
  )
}

const ACCENT_COLORS: AccentColor[] = [
  "orange",
  "blue",
  "green",
  "purple",
  "pink",
  "red",
  "yellow",
  "gray",
]

const CustomColorPicker = ({
  value,
  onChange,
}: {
  value: string
  onChange: (color: string) => void
}) => {
  const barRef = useRef<HTMLDivElement>(null)
  const indicatorRef = useRef<HTMLDivElement>(null)
  const barRectRef = useRef<DOMRect | null>(null)
  const rafIdRef = useRef<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  // Predefined color stops for smooth gradient
  const colorStops = useMemo(
    () => [
      { pos: 0, color: "#3B82F6" },
      { pos: 0.2, color: "#8B5CF6" },
      { pos: 0.35, color: "#EC4899" },
      { pos: 0.5, color: "#EF4444" },
      { pos: 0.65, color: "#F59E0B" },
      { pos: 0.8, color: "#FBBF24" },
      { pos: 1, color: "#10B981" },
    ],
    [],
  )

  // Interpolate color based on position
  const getColorAtPosition = useCallback(
    (position: number) => {
      const pos = Math.max(0, Math.min(1, position))

      // Find the two color stops to interpolate between
      let lowerStop = colorStops[0]
      let upperStop = colorStops.at(-1)

      if (!lowerStop || !upperStop) return "#3B82F6"

      for (let i = 0; i < colorStops.length - 1; i++) {
        const currentStop = colorStops[i]
        const nextStop = colorStops[i + 1]
        if (currentStop && nextStop && pos >= currentStop.pos && pos <= nextStop.pos) {
          lowerStop = currentStop
          upperStop = nextStop
          break
        }
      }

      // Calculate interpolation factor
      const range = upperStop.pos - lowerStop.pos
      const factor = range === 0 ? 0 : (pos - lowerStop.pos) / range

      // Parse hex colors
      const parseHex = (hex: string) => ({
        r: Number.parseInt(hex.slice(1, 3), 16),
        g: Number.parseInt(hex.slice(3, 5), 16),
        b: Number.parseInt(hex.slice(5, 7), 16),
      })

      const color1 = parseHex(lowerStop.color)
      const color2 = parseHex(upperStop.color)

      // Interpolate RGB values
      const r = Math.round(color1.r + (color2.r - color1.r) * factor)
      const g = Math.round(color1.g + (color2.g - color1.g) * factor)
      const b = Math.round(color1.b + (color2.b - color1.b) * factor)

      return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`
    },
    [colorStops],
  )

  const updateFromClientX = useCallback(
    (clientX: number) => {
      const rect = barRectRef.current ?? barRef.current?.getBoundingClientRect()
      if (!rect) return

      const x = Math.max(0, Math.min(rect.width, clientX - rect.left))
      const position = x / rect.width

      if (indicatorRef.current) {
        indicatorRef.current.style.left = `${position * 100}%`
      }

      if (rafIdRef.current == null) {
        rafIdRef.current = requestAnimationFrame(() => {
          rafIdRef.current = null
          const color = getColorAtPosition(position)
          startTransition(() => {
            onChange(color)
          })
        })
      }
    },
    [getColorAtPosition, onChange],
  )

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!barRef.current) return
      setIsDragging(true)
      barRectRef.current = barRef.current.getBoundingClientRect()
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
      updateFromClientX(e.clientX)
    },
    [updateFromClientX],
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return
      updateFromClientX(e.clientX)
    },
    [isDragging, updateFromClientX],
  )

  const endPointer = useCallback((e?: React.PointerEvent) => {
    if (e) {
      try {
        ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
      } catch {
        /* ignore release error */
      }
    }
    setIsDragging(false)
    barRectRef.current = null
  }, [])

  useEffect(() => {
    return () => {
      if (rafIdRef.current != null) cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = null
    }
  }, [])

  // Calculate position indicator based on current color
  const getIndicatorPosition = useCallback(() => {
    if (!value.startsWith("#")) return 50

    // Simple approximation - find closest color stop
    const parseHex = (hex: string) => ({
      r: Number.parseInt(hex.slice(1, 3), 16),
      g: Number.parseInt(hex.slice(3, 5), 16),
      b: Number.parseInt(hex.slice(5, 7), 16),
    })

    const currentColor = parseHex(value)
    let closestPos = 0
    let minDistance = Number.POSITIVE_INFINITY

    for (let i = 0; i <= 100; i++) {
      const pos = i / 100
      const testColor = parseHex(getColorAtPosition(pos))
      const distance =
        Math.abs(testColor.r - currentColor.r) +
        Math.abs(testColor.g - currentColor.g) +
        Math.abs(testColor.b - currentColor.b)

      if (distance < minDistance) {
        minDistance = distance
        closestPos = pos
      }
    }

    return closestPos * 100
  }, [value, getColorAtPosition])

  const gradientStyle = useMemo(
    () => ({
      background: `linear-gradient(to right, ${colorStops
        .map((stop) => `${stop.color} ${stop.pos * 100}%`)
        .join(", ")})`,
      touchAction: "none" as const,
    }),
    [colorStops],
  )

  return (
    <div className="w-[280px]">
      {/* Color gradient bar */}
      <div className="relative">
        <div
          ref={barRef}
          className="h-6 w-full cursor-pointer"
          style={gradientStyle}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endPointer}
          onPointerCancel={endPointer}
        />
        {/* Selection indicator */}
        <div
          ref={indicatorRef}
          className="pointer-events-none absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-white/20 shadow-lg backdrop-blur-sm"
          style={{
            left: `${getIndicatorPosition()}%`,
            willChange: "left",
          }}
        />
      </div>
    </div>
  )
}

const AccentColorSelector = () => {
  const { t } = useTranslation("settings")
  const accentColor = useUISettingKey("accentColor")
  const isDark = useIsDark()
  const [customColor, setCustomColor] = useState("#5CA9F2")
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)

  const isCustomColor = !ACCENT_COLORS.includes(accentColor as any)

  const handleCustomColorChange = useMemo(
    () =>
      throttle((color: string) => {
        setCustomColor(color)
        setUISetting("accentColor", color)
      }, 120),
    [],
  )
  return (
    <SettingItemGroup>
      <div className="mt-4 flex items-center justify-between">
        <span className="shrink-0 text-sm font-medium">{t("appearance.accent_color.label")}</span>
        <div className="flex items-center gap-3 pr-1">
          {ACCENT_COLORS.map((color) => {
            const isSelected = accentColor === color
            const colorValue = getAccentColorValue(color)
            const bgColor = colorValue ? colorValue[isDark ? "dark" : "light"] : "#5CA9F2"

            return (
              <button
                key={color}
                type="button"
                className="group relative flex size-7 items-center justify-center rounded-full transition-all duration-200 hover:scale-110"
                onClick={() => setUISetting("accentColor", color)}
                style={{
                  backgroundColor: bgColor,
                }}
              >
                {/* Selection ring */}
                {isSelected && (
                  <div
                    className="absolute inset-0 rounded-full ring-2 ring-offset-2 ring-offset-white dark:ring-offset-neutral-900"
                    style={
                      {
                        "--tw-ring-color": bgColor,
                      } as React.CSSProperties
                    }
                  />
                )}

                {/* Checkmark for selected color */}
                {isSelected && (
                  <i className="i-mgc-check-cute-re text-sm text-white drop-shadow-sm" />
                )}

                {/* Hover effect */}
                <div className="absolute inset-0 rounded-full bg-white opacity-0 transition-opacity duration-200 group-hover:opacity-20" />
              </button>
            )
          })}

          {/* Custom color button with popover */}
          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="group relative flex size-7 items-center justify-center rounded-full transition-all duration-200 hover:scale-110"
                style={{
                  background: isCustomColor
                    ? (getAccentColorValue(accentColor)?.[isDark ? "dark" : "light"] ?? "#5CA9F2")
                    : "linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%)",
                }}
              >
                {/* Selection ring for custom color */}
                {isCustomColor && (
                  <div
                    className="absolute inset-0 rounded-full ring-2 ring-offset-2 ring-offset-white dark:ring-offset-neutral-900"
                    style={
                      {
                        "--tw-ring-color":
                          getAccentColorValue(accentColor)?.[isDark ? "dark" : "light"] ??
                          "#5CA9F2",
                      } as React.CSSProperties
                    }
                  />
                )}

                {/* Icon */}
                {isCustomColor ? (
                  <i className="i-mgc-check-cute-re text-sm text-white drop-shadow-sm" />
                ) : (
                  <i className="i-mgc-add-cute-re text-sm text-white drop-shadow-sm" />
                )}

                {/* Hover effect */}
                <div className="absolute inset-0 rounded-full bg-white opacity-0 transition-opacity duration-200 group-hover:opacity-20" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-auto p-0">
              <CustomColorPicker
                value={isCustomColor ? accentColor : customColor}
                onChange={handleCustomColorChange}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      <SettingDescription>{t("appearance.accent_color.description")}</SettingDescription>
    </SettingItemGroup>
  )
}

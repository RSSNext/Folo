import { Button } from "@follow/components/ui/button/index.js"
import { Input } from "@follow/components/ui/input/index.js"
import { ResponsiveSelect } from "@follow/components/ui/select/responsive.js"
import { IN_ELECTRON } from "@follow/shared/constants"
import { nextFrame } from "@follow/utils/dom"
import { getStorageNS } from "@follow/utils/ns"
import { useQuery } from "@tanstack/react-query"
import * as React from "react"
import { useCallback, useEffect, useMemo, useRef } from "react"
import { useTranslation } from "react-i18next"

import { setUISetting, useUISettingSelector } from "~/atoms/settings/ui"
import { useModalStack } from "~/components/ui/modal/stacked/hooks"
import { ipcServices } from "~/lib/client"

import { SettingDescription } from "../control"
import { SettingItemGroup } from "../section"

const FALLBACK_FONT = "Default (UI Font)"
const DEFAULT_FONT = "SN Pro"
const CUSTOM_FONT = "Custom"
const useFontDataElectron = () => {
  const { t } = useTranslation("settings")
  const { data } = useQuery({
    queryFn: () => ipcServices?.setting.getSystemFonts(),
    queryKey: ["systemFonts"],
  })

  return (
    [
      { label: t("appearance.content_font.default"), value: "inherit" },
      { label: t("appearance.font.system"), value: "system-ui" },
    ] as { label: string; value: string }[]
  ).concat(
    (data || []).map((font) => ({
      label: font,
      value: font,
    })),
  )
}

const useFontDataWeb = () => {
  const { t } = useTranslation("settings")
  return [
    { label: t("appearance.content_font.default"), value: "inherit" },
    { label: t("appearance.font.system"), value: "system-ui" },
    ...[
      // English
      "SF Pro",
      "Segoe UI",
      "Helvetica",
      "Arial",
      // Chinese
      "PingFang SC",
      "PingFang TC",
      "PingFang HK",

      "Microsoft YaHei",
      "Microsoft JhengHei",
      // Japanese
      "Yu Gothic",
      "Hiragino Sans",
    ].map((font) => ({
      label: font,

      value: font,
    })),
    {
      label: t("appearance.font.custom"),
      value: CUSTOM_FONT,
    },
  ]
}

const useFontData = IN_ELECTRON ? useFontDataElectron : useFontDataWeb
export const ContentFontSelector = () => {
  const { t } = useTranslation("settings")
  const data = useFontData()
  const readerFontFamily = useUISettingSelector((state) => state.readerFontFamily || DEFAULT_FONT)
  const setCustom = usePresentCustomFontDialog("readerFontFamily")

  const isCustomFont = useMemo(
    () =>
      readerFontFamily !== "inherit" &&
      data.find((d) => d.value === readerFontFamily) === undefined,
    [data, readerFontFamily],
  )

  return (
    <SettingItemGroup>
      <div className="mt-4 flex items-center justify-between">
        <span className="shrink-0 text-sm font-medium">{t("appearance.content_font.label")}</span>
        <ResponsiveSelect
          defaultValue={FALLBACK_FONT}
          value={readerFontFamily}
          onValueChange={(value) => {
            if (value === CUSTOM_FONT) {
              setCustom()
              return
            }

            setUISetting("readerFontFamily", value)
          }}
          size="sm"
          triggerClassName="w-48"
          items={[
            isCustomFont && { label: readerFontFamily, value: readerFontFamily },
            ...data,
          ].filter((i) => typeof i === "object")}
        />
      </div>
      <SettingDescription>{t("appearance.content_font.description")}</SettingDescription>
    </SettingItemGroup>
  )
}

export const UIFontSelector = () => {
  const { t } = useTranslation("settings")
  // filter out the fallback font
  const data = useFontData()
    .slice(1)
    .filter((d) => d.value !== DEFAULT_FONT)
  const uiFont = useUISettingSelector((state) => state.uiFontFamily)
  const setCustom = usePresentCustomFontDialog("uiFontFamily")
  const isCustomFont = useMemo(
    () => uiFont !== DEFAULT_FONT && data.find((d) => d.value === uiFont) === undefined,
    [data, uiFont],
  )

  return (
    <SettingItemGroup>
      <div className="mt-4 flex items-center justify-between">
        <span className="shrink-0 text-sm font-medium">{t("appearance.ui_font.label")}</span>
        <ResponsiveSelect
          defaultValue={FALLBACK_FONT}
          value={uiFont}
          onValueChange={(value) => {
            if (value === CUSTOM_FONT) {
              setCustom()
              return
            }

            setUISetting("uiFontFamily", value)
          }}
          size="sm"
          triggerClassName="w-48"
          items={[
            isCustomFont && { label: uiFont, value: uiFont },
            { label: DEFAULT_FONT, value: DEFAULT_FONT },
            ...data,
          ].filter((i) => typeof i === "object")}
        />
      </div>
      <SettingDescription>{t("appearance.ui_font.description")}</SettingDescription>
    </SettingItemGroup>
  )
}

const usePresentCustomFontDialog = (setKey: "uiFontFamily" | "readerFontFamily") => {
  const HISTORY_KEY = getStorageNS("customFonts")
  const { present } = useModalStack()
  const { t } = useTranslation("settings")

  return useCallback(() => {
    present({
      title: t("appearance.custom_font"),
      clickOutsideToDismiss: true,
      content: function Content({ dismiss, setClickOutSideToDismiss }) {
        const inputRef = useRef<HTMLInputElement>(null)

        useEffect(() => {
          nextFrame(() => inputRef.current?.focus())
        }, [inputRef])

        const save: React.FormEventHandler = (e) => {
          e.preventDefault()
          const value = inputRef.current?.value
          if (value) {
            setUISetting(setKey, value)
            localStorage.setItem(HISTORY_KEY, value)
            dismiss()
          }
        }
        return (
          <form className="flex flex-col gap-2" onSubmit={save}>
            <Input
              defaultValue={localStorage.getItem(HISTORY_KEY) || ""}
              ref={inputRef}
              onChange={() => {
                setClickOutSideToDismiss(false)
              }}
            />

            <div className="flex justify-end">
              <Button type="submit">{t("appearance.save")}</Button>
            </div>
          </form>
        )
      },
    })
  }, [HISTORY_KEY, present, setKey, t])
}

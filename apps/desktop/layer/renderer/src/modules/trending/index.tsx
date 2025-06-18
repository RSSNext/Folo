import { ResponsiveSelect } from "@follow/components/ui/select/responsive.js"
import { Skeleton } from "@follow/components/ui/skeleton/index.jsx"
import { views } from "@follow/constants"
import { cn } from "@follow/utils/utils"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { setUISetting, useUISettingKey } from "~/atoms/settings/ui"
import { apiClient } from "~/lib/api-fetch"

import { TrendingFeedCard } from "../discover/TrendingFeedCard"

const LanguageOptions = [
  {
    label: "words.all",
    value: "all",
  },
  {
    label: "words.english",
    value: "eng",
  },
  {
    label: "words.chinese",
    value: "cmn",
  },
]

type Language = "all" | "eng" | "cmn"

const viewOptions = [
  {
    label: "words.all",
    value: "all",
  },
  ...views.map((view) => ({
    label: view.name,
    value: `${view.view}`,
  })),
]

type View = (typeof viewOptions)[number]["value"]

export function Trending({
  limit = 20,
  narrow,
  center,
}: {
  limit?: number
  narrow?: boolean
  center?: boolean
}) {
  const { t } = useTranslation()
  const { t: tCommon } = useTranslation("common")
  const lang = useUISettingKey("discoverLanguage")

  const [selectedView, setSelectedView] = useState<View>("all")

  const { data, isLoading } = useQuery({
    queryKey: ["trending", lang, selectedView],
    queryFn: async () => {
      return await apiClient.trending.feeds.$get({
        query: {
          language: lang === "all" ? undefined : lang,
          view: selectedView === "all" ? undefined : Number(selectedView),
          limit,
        },
      })
    },
  })

  return (
    <div className={cn("mx-auto mt-4 w-full max-w-[800px] space-y-6", narrow && "max-w-[400px]")}>
      <div
        className={cn(
          "justify-between md:flex",
          "grid grid-cols-1 grid-rows-2",
          narrow && "flex-col gap-4",
        )}
      >
        <div
          className={cn(
            "flex w-full items-center gap-2 text-xl font-bold",
            narrow && center && "justify-center",
          )}
        >
          <i className="i-mgc-trending-up-cute-re text-xl" />
          <span>{t("words.trending")}</span>
        </div>
        <div className={cn("flex gap-4", center && "md:center justify-end")}>
          <div className="flex items-center">
            <span className="text-text shrink-0 text-sm font-medium">{t("words.language")}:</span>

            <ResponsiveSelect
              value={lang}
              onValueChange={(value) => {
                setUISetting("discoverLanguage", value as Language)
              }}
              triggerClassName="h-8 rounded border-0"
              size="sm"
              items={LanguageOptions}
              renderItem={(item) => tCommon(item.label as any)}
              renderValue={(item) => tCommon(item.label as any)}
            />
          </div>
          <div className="flex items-center">
            <span className="text-text shrink-0 text-sm font-medium">{t("words.view")}:</span>
            <ResponsiveSelect
              value={selectedView}
              onValueChange={(value: string) => {
                setSelectedView(value as View)
              }}
              triggerClassName="h-8 rounded border-0"
              size="sm"
              items={viewOptions}
              renderItem={(item) => <>{tCommon(item.label as any)}</>}
            />
          </div>
        </div>
      </div>
      <div className={cn("grid grid-cols-2 gap-x-7 gap-y-3", narrow && "grid-cols-1")}>
        {isLoading ? (
          <>
            {Array.from({ length: limit }).map((_, index) => (
              <Skeleton key={index} className="h-[146px] w-[386px]" />
            ))}
          </>
        ) : (
          data?.data?.map((item, index) => (
            <div className="relative m-4" key={item.feed.id}>
              <TrendingFeedCard item={item} />
              <div className="pointer-events-none absolute inset-0 -left-5 -top-6 overflow-hidden rounded-xl">
                <div
                  className={cn(
                    "center absolute -left-5 -top-6 size-12 rounded-br-3xl pl-4 pt-5 text-xs",
                    index < 3
                      ? cn(
                          "bg-accent text-white",
                          index === 0 && "bg-accent",
                          index === 1 && "bg-accent/90",
                          index === 2 && "bg-accent/80",
                        )
                      : "bg-material-opaque",
                  )}
                >
                  {index + 1}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

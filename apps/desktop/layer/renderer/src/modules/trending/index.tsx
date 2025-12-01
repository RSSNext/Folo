import { useScrollElementUpdate } from "@follow/components/ui/scroll-area/hooks.js"
import { ResponsiveSelect } from "@follow/components/ui/select/responsive.js"
import { Skeleton } from "@follow/components/ui/skeleton/index.jsx"
import { FeedViewType, getView, getViewList } from "@follow/constants"
import { cn } from "@follow/utils/utils"
import { useQuery } from "@tanstack/react-query"
import { cloneElement, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { setUISetting, useUISettingKey } from "~/atoms/settings/ui"
import { followClient } from "~/lib/api-client"

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

type View = "all" | string

const buildViewOptions = () => {
  const allView = getView(FeedViewType.All)
  return [
    {
      label: "words.all",
      value: "all" as const,
      icon: allView?.icon,
      className: allView?.className,
    },
    ...getViewList().map((view) => ({
      label: view.name,
      value: `${view.view}`,
      icon: view.icon,
      className: view.className,
    })),
  ]
}

export function Trending({
  limit = 20,
  narrow,
  center,
  hideHeader = false,
}: {
  limit?: number
  narrow?: boolean
  center?: boolean
  hideHeader?: boolean
}) {
  const { t } = useTranslation()
  const { t: tCommon } = useTranslation("common")
  const lang = useUISettingKey("discoverLanguage")
  const { onUpdateMaxScroll } = useScrollElementUpdate()

  const [selectedView, setSelectedView] = useState<View>("all")
  const viewOptions = useMemo(() => buildViewOptions(), [])

  const { data, isLoading } = useQuery({
    queryKey: ["trending", lang, selectedView],
    queryFn: async () => {
      return await followClient.api.trending.getFeeds({
        language: lang === "all" ? undefined : lang,
        view: selectedView === "all" ? undefined : Number(selectedView),
        limit,
      })
    },
    meta: {
      persist: true,
    },
  })

  useEffect(() => {
    if (!isLoading) {
      onUpdateMaxScroll?.()
    }
  }, [isLoading])

  return (
    <div className={cn("mx-auto mt-4 w-full max-w-[800px] space-y-6", narrow && "max-w-[400px]")}>
      {!hideHeader && (
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
          <div className={cn("flex gap-4", center && "justify-end md:center")}>
            <div className="flex items-center">
              <span className="shrink-0 text-sm font-medium text-text">{t("words.language")}:</span>

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
            <div className="flex items-center gap-2">
              <span className="shrink-0 text-sm font-medium text-text">{t("words.view")}:</span>
              <div className="flex items-center gap-1 rounded-lg bg-material-thin p-1">
                {viewOptions.map((option) => {
                  const isSelected = selectedView === option.value
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setSelectedView(option.value)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
                        isSelected
                          ? "bg-material-medium text-text"
                          : "text-text-secondary hover:bg-material-thin hover:text-text",
                      )}
                    >
                      {option.icon &&
                        cloneElement(option.icon, {
                          className: cn(
                            "text-base",
                            isSelected && option.className,
                            option.icon?.props?.className,
                          ),
                        })}
                      <span>{tCommon(option.label as any)}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
      {hideHeader && (
        <div className="-mt-2 mb-4 flex justify-center">
          <div className="flex items-center gap-1 p-1">
            {viewOptions.map((option) => {
              const isSelected = selectedView === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSelectedView(option.value)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
                    isSelected
                      ? "bg-material-medium text-text"
                      : "text-text-secondary hover:bg-material-thin hover:text-text",
                  )}
                >
                  {option.icon &&
                    cloneElement(option.icon, {
                      className: cn(
                        "text-base",
                        isSelected && option.className,
                        option.icon?.props?.className,
                      ),
                    })}
                  <span>{tCommon(option.label as any)}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
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

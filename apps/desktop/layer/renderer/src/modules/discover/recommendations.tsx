import { isMobile } from "@follow/components/hooks/useMobile.js"
import { EmptyIcon } from "@follow/components/icons/empty.js"
import { ActionButton } from "@follow/components/ui/button/action-button.js"
import { Card, CardContent } from "@follow/components/ui/card/index.jsx"
import { ScrollArea } from "@follow/components/ui/scroll-area/ScrollArea.js"
import { ResponsiveSelect } from "@follow/components/ui/select/responsive.js"
import { EllipsisHorizontalTextWithTooltip } from "@follow/components/ui/typography/EllipsisWithTooltip.js"
import { CategoryMap, RSSHubCategories } from "@follow/constants"
import { nextFrame } from "@follow/utils/dom"
import { isASCII } from "@follow/utils/utils"
import { keepPreviousData } from "@tanstack/react-query"
import { useCallback, useEffect, useMemo, useState } from "react"
import { flushSync } from "react-dom"
import { useTranslation } from "react-i18next"

import { setUISetting, useUISettingKey } from "~/atoms/settings/ui"
import { DrawerModalLayout } from "~/components/ui/modal/stacked/custom-modal"
import { useCurrentModal, useModalStack } from "~/components/ui/modal/stacked/hooks"
import { useAuthQuery } from "~/hooks/common"
import { Queries } from "~/queries"

import { FeedIcon } from "../feed/feed-icon"
import { RecommendationContent } from "./RecommendationContent"

const LanguageOptions = [
  {
    label: "All",
    value: "all",
  },
  {
    label: "English",
    value: "eng",
  },
  {
    label: "中文",
    value: "cmn",
  },
] as const

type Language = (typeof LanguageOptions)[number]["value"]
type DiscoverCategories = (typeof RSSHubCategories)[number] | string

const LanguageMap = {
  all: "all",
  eng: "en",
  cmn: "zh-CN",
} as const

const fetchRsshubPopular = (category: DiscoverCategories, lang: Language) => {
  return Queries.discover.rsshubCategory({
    category: "popular",
    categories: category === "all" ? "popular" : `popular,${category}`,
    lang: LanguageMap[lang],
  })
}
let firstLoad = true
export function Recommendations() {
  const { t } = useTranslation()
  const { present } = useModalStack()

  const [category, setCategory] = useState<DiscoverCategories>("all")
  const lang = useUISettingKey("discoverLanguage")

  const rsshubPopular = useAuthQuery(fetchRsshubPopular(category, lang), {
    meta: {
      persist: true,
    },
    staleTime: 1000 * 60 * 60 * 24, // 1 day
    refetchOnMount: firstLoad ? "always" : true,
    placeholderData: keepPreviousData,
  })

  firstLoad = false

  const { data, isLoading } = rsshubPopular

  const keys = useMemo(() => {
    if (!data) {
      return []
    }
    return Object.keys(data).sort((a, b) => {
      const aname = data[a].name
      const bname = data[b].name

      const aRouteName = data[a].routes[Object.keys(data[a].routes)[0]].name
      const bRouteName = data[b].routes[Object.keys(data[b].routes)[0]].name

      const ia = isASCII(aname) && isASCII(aRouteName)
      const ib = isASCII(bname) && isASCII(bRouteName)

      if (ia && ib) {
        return aname.toLowerCase() < bname.toLowerCase() ? -1 : 1
      } else if (ia || ib) {
        return ia > ib ? -1 : 1
      } else {
        return 0
      }
    })
  }, [data])

  const handleCategoryChange = useCallback(
    (value: DiscoverCategories) => {
      flushSync(() => {
        setCategory(value)
      })
      rsshubPopular.refetch()
    },
    [rsshubPopular],
  )

  const handleLangChange = useCallback(
    (value: string) => {
      flushSync(() => {
        setUISetting("discoverLanguage", value as Language)
      })
      rsshubPopular.refetch()
    },
    [rsshubPopular],
  )

  const handleShowCategoryContent = (selectedCategory: DiscoverCategories) => {
    present({
      id: `category-content-${selectedCategory}`,
      CustomModalComponent: !isMobile() ? DrawerModalLayout : undefined,

      content: () => {
        return (
          <RecommendationDrawerContent
            keys={keys}
            data={data}
            selectedCategory={selectedCategory}
            handleCategoryChange={handleCategoryChange}
          />
        )
      },
      title: t(`discover.category.${selectedCategory}` as any, { ns: "common" }),
    })
  }

  if (isLoading) {
    return null
  }

  if (!data) {
    return null
  }

  return (
    <div className="mt-4 w-full max-w-[800px] space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center justify-center gap-2 text-center text-xl font-bold">
          <i className="i-mgc-grid-2-cute-re text-xl" />
          <span>{t("words.categories")}</span>
        </div>
        <div className="center flex justify-center">
          <div className="flex items-center gap-2">
            <span className="text-text shrink-0 text-sm font-medium">{t("words.language")}</span>
            <ResponsiveSelect
              value={lang}
              onValueChange={handleLangChange}
              triggerClassName="h-8 rounded border-0"
              size="sm"
              items={LanguageOptions as any}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {RSSHubCategories.map((cat) => (
          <Card
            key={cat}
            className="cursor-pointer transition-all duration-200 hover:scale-[102%] hover:shadow-lg"
            style={{
              backgroundImage: `linear-gradient(-135deg, ${CategoryMap[cat]?.color}80, ${CategoryMap[cat]?.color})`,
            }}
            onClick={() => handleShowCategoryContent(cat)}
          >
            <CardContent className="group relative flex aspect-square flex-col overflow-hidden p-0">
              <div className="absolute right-2 top-2 size-12 rotate-12 opacity-20">
                <div className="text-5xl">{CategoryMap[cat]?.emoji}</div>
              </div>
              <div className="flex size-full flex-col items-start justify-end p-6 text-left">
                <div className="mb-3 text-4xl transition-transform duration-300 group-hover:scale-[1.2]">
                  {CategoryMap[cat]?.emoji}
                </div>
                <div className="text-lg font-bold text-white drop-shadow-sm">
                  {t(`discover.category.${cat}`, { ns: "common" })}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

const RecommendationDrawerContent = ({
  keys,
  data,
  selectedCategory,
  handleCategoryChange,
}: {
  keys: string[]
  data: any
  selectedCategory: string
  handleCategoryChange: (category: string) => void
}) => {
  const { t } = useTranslation()

  const filteredItems = keys
    .map((key) => {
      if (selectedCategory !== "all") {
        const categories = new Set<string>()
        for (const route in data![key].routes) {
          const routeData = data![key].routes[route]!
          if (routeData.categories) {
            routeData.categories.forEach((c) => categories.add(c))
          }
        }
        if (!categories.has(selectedCategory as string)) {
          return null
        }
      }

      return {
        key,
        data: data![key],
        routePrefix: key,
      }
    })
    .filter(Boolean)

  const { dismiss } = useCurrentModal()

  // Delay rendering to avoid layout shift
  const [ready, setReady] = useState(false)

  useEffect(() => {
    nextFrame(() => {
      setReady(true)
    })
  }, [])

  return (
    <div className="absolute inset-0 flex flex-col">
      <h1 className="text-title2 mt-4 pl-8 font-semibold">
        {t(`discover.category.${selectedCategory}` as any, { ns: "common" })}
      </h1>

      {/* Close */}
      <ActionButton
        className="absolute right-4 top-4 z-10"
        onClick={dismiss}
        tooltip={t("words.close", { ns: "common" })}
      >
        <i className="i-mgc-close-cute-re" />
      </ActionButton>
      <div className="bg-border m-4 h-px shrink-0" />
      {filteredItems.length > 0 ? (
        <ScrollArea rootClassName="w-full -mt-4" viewportClassName="px-8 pt-4 pb-8">
          {ready && (
            <div
              className="animate-in fade-in duration-300"
              style={{
                columnCount: isMobile() ? 1 : 2,
                columnGap: "16px",
                width: "100%",
              }}
            >
              {filteredItems.map(
                (item) =>
                  item && (
                    <div key={item.key} className="mb-4 break-inside-avoid">
                      <RecommendationListItem
                        data={item.data}
                        routePrefix={item.routePrefix}
                        setCategory={handleCategoryChange}
                      />
                    </div>
                  ),
              )}
            </div>
          )}
        </ScrollArea>
      ) : (
        <div className="flex h-full -translate-y-12 flex-col items-center justify-center text-center">
          <div className="mb-4 text-6xl">
            <EmptyIcon />
          </div>
          <p className="text-text text-title2">
            {t("common.noContent", { defaultValue: "No content found in this category" })}
          </p>
          <p className="text-text-secondary text-body mt-2">
            {t("discover.tryAnotherCategory", {
              defaultValue: "Try selecting another category or language",
            })}
          </p>
        </div>
      )}
    </div>
  )
}

const RecommendationListItem = ({
  data,
  routePrefix,
  setCategory,
}: {
  data: any
  routePrefix: string
  setCategory: (category: string) => void
}) => {
  const { t } = useTranslation()
  const { present } = useModalStack()

  const { maintainers, categories, routes } = useMemo(() => {
    const maintainers = new Set<string>()
    const categories = new Set<string>()
    const routes = Object.keys(data.routes)

    for (const route in data.routes) {
      const routeData = data.routes[route]!
      if (routeData.maintainers) {
        routeData.maintainers.forEach((m) => maintainers.add(m))
      }
      if (routeData.categories) {
        routeData.categories.forEach((c) => categories.add(c))
      }
    }
    categories.delete("popular")
    return {
      maintainers: Array.from(maintainers),
      categories: Array.from(categories) as unknown as typeof RSSHubCategories,
      routes,
    }
  }, [data])

  return (
    <Card className="shadow-background border-border overflow-hidden rounded-lg border transition-shadow duration-200 hover:shadow-md">
      <div className="border-border flex items-center gap-3 border-b p-4">
        <div className="bg-background size-8 overflow-hidden rounded-full">
          <FeedIcon className="mr-0 size-8" size={32} siteUrl={`https://${data.url}`} />
        </div>
        <div className="flex w-full flex-1 justify-between">
          <h3 className="text-title3 line-clamp-1 font-medium">
            <a
              href={`https://${data.url}`}
              target="_blank"
              rel="noreferrer"
              className="hover:underline"
            >
              {data.name}
            </a>
          </h3>

          <div className="flex flex-wrap gap-1.5 text-xs">
            {categories.map((c) => (
              <button
                onClick={() => {
                  if (!RSSHubCategories.includes(c)) return
                  setCategory(c)
                }}
                key={c}
                type="button"
                className={`bg-accent/10 cursor-pointer rounded-full px-2 py-0.5 duration-200 ${
                  !RSSHubCategories.includes(c) ? "pointer-events-none opacity-50" : ""
                }`}
              >
                {RSSHubCategories.includes(c)
                  ? t(`discover.category.${c}`, { ns: "common" })
                  : c.charAt(0).toUpperCase() + c.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="p-4">
        <ul className="text-text mb-3">
          {routes.map((route) => {
            const routeData = data.routes[route]!
            if (Array.isArray(routeData.path)) {
              routeData.path = routeData.path.find((p) => p === route) ?? routeData.path[0]
            }
            return (
              <li
                key={route}
                className="hover:bg-material-opaque -mx-4 flex items-center rounded p-1 px-5 transition-colors"
                role="button"
                onClick={() => {
                  present({
                    id: `recommendation-content-${route}`,
                    content: () => (
                      <RecommendationContent
                        routePrefix={routePrefix}
                        route={data.routes[route]!}
                      />
                    ),
                    icon: <FeedIcon className="size-4" size={16} siteUrl={`https://${data.url}`} />,
                    title: `${data.name} - ${data.routes[route]!.name}`,
                  })
                }}
              >
                <div className="bg-accent mr-2 size-1.5 rounded-full" />
                <div className="relative h-5 grow">
                  <div className="absolute inset-0">
                    <EllipsisHorizontalTextWithTooltip className="text-sm">
                      {routeData.name}
                    </EllipsisHorizontalTextWithTooltip>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>

        {maintainers.length > 0 && (
          <div className="text-text-secondary mt-2 flex items-center text-xs">
            <i className="i-mgc-hammer-cute-re mr-1 shrink-0 translate-y-0.5 self-start" />
            <span>
              {maintainers.map((m, i) => (
                <span key={m}>
                  <a
                    href={`https://github.com/${m}`}
                    className="hover:underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    @{m}
                  </a>
                  {i < maintainers.length - 1 ? ", " : ""}
                </span>
              ))}
            </span>
          </div>
        )}
      </div>
    </Card>
  )
}

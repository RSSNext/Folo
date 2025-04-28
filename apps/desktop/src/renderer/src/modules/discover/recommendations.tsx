import { isMobile } from "@follow/components/hooks/useMobile.js"
import { EmptyIcon } from "@follow/components/icons/empty.js"
import { ActionButton } from "@follow/components/ui/button/action-button.js"
import { Card, CardContent } from "@follow/components/ui/card/index.jsx"
import { Divider } from "@follow/components/ui/divider/Divider.js"
import { LoadingCircle } from "@follow/components/ui/loading/index.js"
import { Masonry } from "@follow/components/ui/masonry/index.js"
import { ScrollArea } from "@follow/components/ui/scroll-area/ScrollArea.js"
import { ResponsiveSelect } from "@follow/components/ui/select/responsive.js"
import { CategoryMap, RSSHubCategories } from "@follow/constants"
import { isASCII } from "@follow/utils/utils"
import { keepPreviousData } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { flushSync } from "react-dom"
import { useTranslation } from "react-i18next"

import { useGeneralSettingKey } from "~/atoms/settings/general"
import { DrawerModalLayout } from "~/components/ui/modal/stacked/custom-modal"
import { useCurrentModal, useModalStack } from "~/components/ui/modal/stacked/hooks"
import { useAuthQuery } from "~/hooks/common"
import { Queries } from "~/queries"

import { TrendingButton } from "../trending"
import { RecommendationCard } from "./recommendations-card"

const LanguageOptions = [
  {
    label: "All",
    value: "all",
  },
  {
    label: "English",
    value: "en",
  },
  {
    label: "中文",
    value: "zh-CN",
  },
] as const

type Language = (typeof LanguageOptions)[number]["value"]
type DiscoverCategories = (typeof RSSHubCategories)[number] | string

const fetchRsshubPopular = (category: DiscoverCategories, lang: Language) => {
  return Queries.discover.rsshubCategory({
    category: "popular",
    categories: category === "all" ? "popular" : `popular,${category}`,
    lang,
  })
}
let firstLoad = true
export function Recommendations() {
  const { t } = useTranslation()
  const lang = useGeneralSettingKey("language")
  const { present } = useModalStack()

  const defaultLang = !lang || ["zh-CN", "zh-HK", "zh-TW"].includes(lang) ? "all" : "en"
  const [category, setCategory] = useState<DiscoverCategories>("all")
  const [selectedLang, setSelectedLang] = useState<Language>(defaultLang)

  const rsshubPopular = useAuthQuery(fetchRsshubPopular(category, selectedLang), {
    meta: {
      persist: true,
    },
    staleTime: 1000 * 60 * 60 * 24, // 1 day
    refetchOnMount: firstLoad ? "always" : true,
    placeholderData: keepPreviousData,
  })

  firstLoad = false

  const { data, isLoading, isFetching } = rsshubPopular

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

  const handleCategoryChange = (value: DiscoverCategories) => {
    flushSync(() => {
      setCategory(value)
    })
    rsshubPopular.refetch()
  }

  const handleLangChange = (value: string) => {
    flushSync(() => {
      setSelectedLang(value as Language)
    })
    rsshubPopular.refetch()
  }

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
    <div className="mt-12 w-full max-w-[1200px]">
      <div className="center relative flex">
        <div className="absolute bottom-0 right-0 flex items-center gap-2">
          <span className="text-headline text-text font-medium">Preferred language:</span>
          <ResponsiveSelect
            value={selectedLang}
            onValueChange={handleLangChange}
            triggerClassName="w-32 h-8 rounded"
            size="sm"
            items={LanguageOptions as any}
          />
          <TrendingButton language={selectedLang} />
        </div>
        {isFetching && (
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-center gap-8">
            <span className="opacity-0" aria-hidden>
              {t("discover.popular")}
            </span>

            <LoadingCircle size="small" className="center flex" />
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {RSSHubCategories.map((cat) => (
          <Card
            key={cat}
            className="cursor-pointer transition-all duration-200 hover:scale-[102%] hover:shadow-lg"
            style={{
              backgroundImage: `linear-gradient(-135deg, ${CategoryMap[cat]?.color}80, ${CategoryMap[cat]?.color})`,
            }}
            onClick={() => handleShowCategoryContent(cat)}
          >
            <CardContent className="flex min-h-[100px] flex-col items-center justify-center p-4 text-center">
              <div className="mb-2 text-2xl">{CategoryMap[cat]?.emoji}</div>
              <div className="font-medium text-white">
                {t(`discover.category.${cat}`, { ns: "common" })}
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

  return (
    <div className="absolute inset-0 flex flex-col">
      <h1 className="text-title2 mt-4 pl-8 font-semibold">
        {t(`discover.category.${selectedCategory}` as any, { ns: "common" })}
      </h1>

      {/* Close */}
      <ActionButton
        className="absolute right-4 top-4"
        onClick={dismiss}
        tooltip={t("words.close", { ns: "common" })}
      >
        <i className="i-mgc-close-cute-re" />
      </ActionButton>
      <Divider className="m-4" />
      {filteredItems.length > 0 ? (
        <ScrollArea rootClassName="w-full" viewportClassName="px-8">
          <Masonry
            items={filteredItems}
            columnGutter={16}
            columnWidth={280}
            columnCount={isMobile() ? 1 : 2}
            overscanBy={2}
            render={({ data: itemData }) => {
              if (!itemData) return null
              return (
                <RecommendationCard
                  key={itemData.key}
                  data={itemData.data}
                  routePrefix={itemData.routePrefix}
                  setCategory={handleCategoryChange}
                />
              )
            }}
          />
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

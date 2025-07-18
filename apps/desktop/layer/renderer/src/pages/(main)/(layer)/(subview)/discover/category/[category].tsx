import { EmptyIcon } from "@follow/components/icons/empty.js"
import { Card } from "@follow/components/ui/card/index.jsx"
import { Input } from "@follow/components/ui/input/Input.js"
import { LoadingCircle } from "@follow/components/ui/loading/index.js"
import { useScrollElementUpdate } from "@follow/components/ui/scroll-area/hooks.js"
import { EllipsisHorizontalTextWithTooltip } from "@follow/components/ui/typography/EllipsisWithTooltip.js"
import { CategoryMap, RSSHubCategories } from "@follow/constants"
import { cn, formatNumber } from "@follow/utils/utils"
import { keepPreviousData } from "@tanstack/react-query"
import { memo, useCallback, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link, useParams } from "react-router"

import { useUISettingKey } from "~/atoms/settings/ui"
import { useModalStack } from "~/components/ui/modal/stacked/hooks"
import { useFollow } from "~/hooks/biz/useFollow"
import { useAuthQuery } from "~/hooks/common"
import type { apiClient } from "~/lib/api-fetch"
import { useSubViewTitle } from "~/modules/app-layout/subview/hooks"
import { RecommendationContent } from "~/modules/discover/RecommendationContent"
import { FeedIcon } from "~/modules/feed/feed-icon"
import { Queries } from "~/queries"
import { getPreferredTitle } from "~/store/feed/hooks"

const LanguageMap = {
  all: "all",
  eng: "en",
  cmn: "zh-CN",
} as const

type RouteData = Awaited<ReturnType<typeof apiClient.discover.rsshub.$get>>["data"]

export const Component = () => {
  const { t } = useTranslation()
  const lang = useUISettingKey("discoverLanguage")
  const category = useParams().category as (typeof RSSHubCategories)[number]
  const title = t(`discover.category.${category}`, { ns: "common" })
  useSubViewTitle(title)

  const rsshubPopular = useAuthQuery(
    Queries.discover.rsshubCategory({
      categories: category === "all" ? "popular" : `${category}`,
      lang: LanguageMap[lang],
    }),
    {
      staleTime: 1000 * 60 * 60 * 24, // 1 day
      placeholderData: keepPreviousData,
      meta: {
        persist: true,
      },
    },
  )

  const data: RouteData = rsshubPopular.data as any

  const rsshubAnalytics = useAuthQuery(Queries.discover.rsshubAnalytics({ lang }), {
    staleTime: 1000 * 60 * 60 * 24, // 1 day
    placeholderData: keepPreviousData,
    meta: {
      persist: true,
    },
  })

  const rsshubAnalyticsData: Awaited<
    ReturnType<(typeof apiClient)["discover"]["rsshub-analytics"]["$get"]>
  >["data"] = rsshubAnalytics.data as any

  const isLoading = rsshubPopular.isLoading || rsshubAnalytics.isLoading

  const keys = useMemo(() => {
    if (!data || !rsshubAnalyticsData) {
      return []
    }
    return Object.keys(data).sort((a, b) => {
      const aRoutes = Object.keys(data[a]?.routes ?? {})
      const aHeat = aRoutes.reduce((acc, route) => {
        return acc + (rsshubAnalyticsData?.[`/${a}${route}`]?.subscriptionCount ?? 0)
      }, 0)
      const bRoutes = Object.keys(data[b]?.routes ?? {})
      const bHeat = bRoutes.reduce((acc, route) => {
        return acc + (rsshubAnalyticsData?.[`/${b}${route}`]?.subscriptionCount ?? 0)
      }, 0)

      return bHeat - aHeat
    })
  }, [data, rsshubAnalyticsData])

  const [search, setSearch] = useState("")

  const items = useMemo(
    () =>
      keys.map((key) => {
        return {
          key,
          data: data![key],
          routePrefix: key,
        }
      }),
    [keys, data],
  )

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const routes = Object.values(item.data?.routes ?? {})
      const sources = [
        item.data?.name,
        item.routePrefix,
        ...routes.map((route) => route.name),
        ...routes.map((route) => route.path),
      ]

      return sources.some((source) => {
        return source?.toLowerCase().includes(search.toLowerCase())
      })
    })
  }, [items, search])

  const { onUpdateMaxScroll } = useScrollElementUpdate()
  useEffect(() => {
    if (!isLoading && onUpdateMaxScroll) {
      // Defer to next tick to avoid blocking main thread
      const timeoutId = setTimeout(() => {
        onUpdateMaxScroll()
      }, 0)
      return () => clearTimeout(timeoutId)
    }
  }, [isLoading])

  return (
    <div className="w-full max-w-[800px]">
      <div className="mb-10 flex w-full items-center justify-center gap-2 text-center text-2xl font-bold">
        <span>{CategoryMap[category]?.emoji}</span>
        <span>{title}</span>
      </div>
      {isLoading ? (
        <div className="center">
          <LoadingCircle size="large" />
        </div>
      ) : items.length > 0 ? (
        <div className="w-full px-8 pb-8 pt-4">
          <Input
            placeholder="Search"
            className="mb-4"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
            }}
          />
          <div>
            {filteredItems.map(
              (item) =>
                item?.data && (
                  <div key={item.key} className="mb-4 break-inside-avoid">
                    <RecommendationListItem
                      data={item.data}
                      routePrefix={item.routePrefix}
                      rsshubAnalyticsData={rsshubAnalyticsData}
                    />
                  </div>
                ),
            )}
          </div>
        </div>
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

const RecommendationListItem = memo(
  ({
    data,
    routePrefix,
    rsshubAnalyticsData,
  }: {
    data: RouteData[string]
    routePrefix: string
    rsshubAnalyticsData: Awaited<
      ReturnType<(typeof apiClient)["discover"]["rsshub-analytics"]["$get"]>
    >["data"]
  }) => {
    const { t } = useTranslation()
    const { present } = useModalStack()

    const { maintainers, categories, routes } = useMemo(() => {
      const maintainers = new Set<string>()
      const categories = new Set<string>()
      const routes = Object.keys(data.routes).sort((a, b) => {
        const aHeat = rsshubAnalyticsData?.[`/${routePrefix}${a}`]?.subscriptionCount ?? 0
        const bHeat = rsshubAnalyticsData?.[`/${routePrefix}${b}`]?.subscriptionCount ?? 0
        return bHeat - aHeat
      })

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
    }, [data, rsshubAnalyticsData, routePrefix])

    const follow = useFollow()

    const handleRouteClick = useCallback(
      (route: string) => {
        present({
          id: `recommendation-content-${route}`,
          content: () => (
            <RecommendationContent routePrefix={routePrefix} route={data.routes[route]!} />
          ),
          icon: <FeedIcon className="size-4" size={16} siteUrl={`https://${data.url}`} />,
          title: `${data.name} - ${data.routes[route]!.name}`,
        })
      },
      [present, routePrefix, data, data.url, data.name],
    )

    const handleFeedClick = useCallback(
      (feedId: string) => {
        follow({
          isList: false,
          id: feedId,
        })
      },
      [follow],
    )

    return (
      <Card className="shadow-background border-border overflow-hidden rounded-lg border transition-shadow duration-200 hover:shadow-md">
        <div className="border-border flex items-center gap-3 border-b p-4">
          <div className="bg-background size-8 overflow-hidden rounded-full">
            <FeedIcon className="mr-0 size-8" size={32} siteUrl={`https://${data.url}`} />
          </div>
          <div className="flex w-full flex-1 justify-between">
            <h3 className="line-clamp-1 text-base font-medium">
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
                <Link
                  to={`/discover/category/${c}`}
                  key={c}
                  className={cn(
                    "bg-accent/10 cursor-pointer rounded-full px-2 py-0.5 leading-5 duration-200",
                    !RSSHubCategories.includes(c) ? "pointer-events-none opacity-50" : "",
                  )}
                >
                  {RSSHubCategories.includes(c)
                    ? t(`discover.category.${c}`, { ns: "common" })
                    : c.charAt(0).toUpperCase() + c.slice(1)}
                </Link>
              ))}
            </div>
          </div>
        </div>
        <div className="p-4 pt-2">
          <ul className="text-text mb-3">
            {routes.map((route) => (
              <RouteItem
                key={route}
                route={route}
                routeData={data.routes[route]!}
                routePrefix={routePrefix}
                rsshubAnalyticsData={rsshubAnalyticsData}
                onRouteClick={handleRouteClick}
                onFeedClick={handleFeedClick}
              />
            ))}
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
  },
)

const RouteItem = memo(
  ({
    route,
    routeData,
    routePrefix,
    rsshubAnalyticsData,
    onRouteClick,
    onFeedClick,
  }: {
    route: string
    routeData: any
    routePrefix: string
    rsshubAnalyticsData: any
    onRouteClick: (route: string) => void
    onFeedClick: (feedId: string) => void
  }) => {
    if (Array.isArray(routeData.path)) {
      routeData.path = routeData.path.find((p: string) => p === route) ?? routeData.path[0]
    }

    const analytics = rsshubAnalyticsData?.[`/${routePrefix}${routeData.path}`]

    return (
      <li
        className="hover:bg-material-opaque -mx-4 rounded p-3 px-5 transition-colors"
        role="button"
        onClick={() => onRouteClick(route)}
      >
        <div className="w-full">
          <div className="flex w-full items-center gap-8">
            <div className="flex flex-1 items-center gap-2">
              <div className="bg-accent mr-2 size-1.5 rounded-full" />
              <div className="relative h-5 grow">
                <div className="text-title3 absolute inset-0 flex items-center gap-3 font-medium">
                  <EllipsisHorizontalTextWithTooltip>
                    {routeData.name}
                  </EllipsisHorizontalTextWithTooltip>
                  <EllipsisHorizontalTextWithTooltip className="text-text-secondary text-xs">{`rsshub://${routePrefix}${routeData.path}`}</EllipsisHorizontalTextWithTooltip>
                </div>
              </div>
            </div>
            {!!analytics?.subscriptionCount && (
              <div className="flex items-center gap-0.5 text-xs">
                <i className="i-mgc-fire-cute-re" />
                {formatNumber(analytics?.subscriptionCount || 0)}
              </div>
            )}
          </div>
          {analytics?.topFeeds && (
            <div className="mt-2 flex items-center gap-10 pl-5 text-xs">
              {analytics.topFeeds.slice(0, 2).map((feed: any) => (
                <div key={feed.id} className="flex w-2/5 flex-1 items-center text-sm">
                  <FeedIcon
                    feed={feed}
                    className="mask-squircle mask shrink-0 rounded-none"
                    size={16}
                  />
                  <div
                    className="min-w-0 leading-tight"
                    onClick={(e) => {
                      e.stopPropagation()
                      onFeedClick(feed.id)
                    }}
                  >
                    <EllipsisHorizontalTextWithTooltip className="truncate">
                      {getPreferredTitle(feed) || feed?.title}
                    </EllipsisHorizontalTextWithTooltip>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </li>
    )
  },
)

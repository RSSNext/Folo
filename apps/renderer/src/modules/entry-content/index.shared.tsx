import { getViewport } from "@follow/components/hooks/useViewport.js"
import {
  CircleProgress,
  MaterialSymbolsProgressActivity,
} from "@follow/components/icons/Progress.js"
import { AutoResizeHeight } from "@follow/components/ui/auto-resize-height/index.js"
import { Button, MotionButtonBase } from "@follow/components/ui/button/index.js"
import { LoadingWithIcon } from "@follow/components/ui/loading/index.jsx"
import { RootPortal } from "@follow/components/ui/portal/index.jsx"
import { useScrollViewElement } from "@follow/components/ui/scroll-area/hooks.js"
import { IN_ELECTRON } from "@follow/shared/constants"
import { EventBus } from "@follow/utils/event-bus"
import { springScrollTo } from "@follow/utils/scroller"
import { cn } from "@follow/utils/utils"
import type { FallbackRender } from "@sentry/react"
import type { FC } from "react"
import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { useShowAISummary } from "~/atoms/ai-summary"
import {
  ReadabilityStatus,
  setReadabilityStatus,
  useEntryInReadabilityStatus,
  useEntryReadabilityContent,
} from "~/atoms/readability"
import { enableShowSourceContent } from "~/atoms/source-content"
import { CopyButton } from "~/components/ui/button/CopyButton"
import { Toc } from "~/components/ui/markdown/components/Toc"
import { IconOpacityTransition } from "~/components/ux/transition/icon"
import { isWebBuild } from "~/constants"
import { useEntryReadabilityToggle } from "~/hooks/biz/useEntryActions"
import { useRouteParamsSelector } from "~/hooks/biz/useRouteParams"
import { useAuthQuery } from "~/hooks/common/useBizQuery"
import { getNewIssueUrl } from "~/lib/issues"
import {
  useIsSoFWrappedElement,
  useWrappedElement,
  useWrappedElementSize,
} from "~/providers/wrapped-element-provider"
import { Queries } from "~/queries"
import { useEntry } from "~/store/entry"
import { useFeedById } from "~/store/feed"
import { useInboxById } from "~/store/inbox"

import { EntryContentHTMLRenderer } from "../renderer/html"
import { setEntryContentScrollToTop, setEntryTitleMeta } from "./atoms"

export interface EntryContentProps {
  entryId: string
  noMedia?: boolean
  compact?: boolean
  classNames?: EntryContentClassNames
}
export interface EntryContentClassNames {
  header?: string
}

export const SummaryLoadingSkeleton = (
  <div className="space-y-2">
    <span className="block h-3 w-full animate-pulse rounded-xl bg-zinc-200 dark:bg-neutral-800" />
    <span className="block h-3 w-full animate-pulse rounded-xl bg-zinc-200 dark:bg-neutral-800" />
    <span className="block h-3 w-full animate-pulse rounded-xl bg-zinc-200 dark:bg-neutral-800" />
  </div>
)

export const TitleMetaHandler: Component<{
  entryId: string
}> = ({ entryId }) => {
  const {
    entries: { title: entryTitle },
    feedId,
    inboxId,
  } = useEntry(entryId)!

  const feed = useFeedById(feedId)
  const inbox = useInboxById(inboxId)
  const feedTitle = feed?.title || inbox?.title
  const atTop = useIsSoFWrappedElement()
  useEffect(() => {
    setEntryContentScrollToTop(true)
  }, [entryId])
  useLayoutEffect(() => {
    setEntryContentScrollToTop(atTop)
  }, [atTop])

  useEffect(() => {
    if (entryTitle && feedTitle) {
      setEntryTitleMeta({ title: entryTitle, description: feedTitle })
    }
    return () => {
      setEntryTitleMeta(null)
    }
  }, [entryId, entryTitle, feedTitle])
  return null
}

export const ReadabilityContent = ({ entryId, feedId }: { entryId: string; feedId: string }) => {
  const { t } = useTranslation()
  const result = useEntryReadabilityContent(entryId)
  const view = useRouteParamsSelector((route) => route.view)

  return (
    <div className="grow">
      {result ? (
        <p className="mb-4 rounded-xl border p-3 text-sm opacity-80">
          <i className="i-mgc-information-cute-re mr-1 translate-y-[2px]" />
          {t("entry_content.readability_notice")}
        </p>
      ) : (
        <div className="center mt-16 flex flex-col gap-2">
          <LoadingWithIcon size="large" icon={<i className="i-mgc-docment-cute-re" />} />
          <span className="text-sm">{t("entry_content.fetching_content")}</span>
        </div>
      )}

      <EntryContentHTMLRenderer
        view={view}
        feedId={feedId}
        entryId={entryId}
        as="article"
        className="prose hyphens-auto dark:prose-invert prose-h1:text-[1.6em] prose-h1:font-bold"
      >
        {result?.content ?? ""}
      </EntryContentHTMLRenderer>
    </div>
  )
}

export const NoContent: FC<{
  id: string
  url: string
  sourceContent?: boolean
}> = ({ id, url, sourceContent }) => {
  const status = useEntryInReadabilityStatus(id)
  const { t } = useTranslation("app")

  if (status !== ReadabilityStatus.INITIAL && status !== ReadabilityStatus.FAILURE) {
    return null
  }
  return (
    <div className="center">
      <div className="space-y-2 text-balance text-center text-sm text-zinc-400">
        {(isWebBuild || status === ReadabilityStatus.FAILURE) && (
          <span>{t("entry_content.no_content")}</span>
        )}
        {isWebBuild && (
          <div>
            <span>{t("entry_content.web_app_notice")}</span>
          </div>
        )}
        {!sourceContent && url && IN_ELECTRON && <ReadabilityAutoToggleEffect url={url} id={id} />}
      </div>
    </div>
  )
}

export const ViewSourceContentAutoToggleEffect = () => {
  const onceRef = useRef(false)

  useEffect(() => {
    if (!onceRef.current) {
      onceRef.current = true
      enableShowSourceContent()
    }
  }, [])

  return null
}

export const ReadabilityAutoToggleEffect = ({ url, id }: { url: string; id: string }) => {
  const toggle = useEntryReadabilityToggle({
    id,
    url,
  })
  const onceRef = useRef(false)

  useEffect(() => {
    if (!onceRef.current) {
      onceRef.current = true
      setReadabilityStatus({
        [id]: ReadabilityStatus.INITIAL,
      })
      toggle()
    }
  }, [toggle])

  return null
}

export const RenderError: FallbackRender = ({ error }) => {
  const { t } = useTranslation()
  const nextError = typeof error === "string" ? new Error(error) : (error as Error)
  return (
    <div className="center mt-16 flex flex-col gap-2">
      <i className="i-mgc-close-cute-re text-3xl text-red-500" />
      <span className="font-sans text-sm">
        {t("entry_content.render_error")} {nextError.message}
      </span>
      <Button
        variant={"outline"}
        onClick={() => {
          window.open(
            getNewIssueUrl({
              // body: [
              //   "### Error",
              //   "",
              //   nextError.message,
              //   "",
              //   "### Stack",
              //   "",
              //   "```",
              //   nextError.stack,
              //   "```",
              // ].join("\n"),
              // label: "bug",
              // title: "Render error",
              template: "bug_report.yml",
            }),
          )
        }}
      >
        {t("entry_content.report_issue")}
      </Button>
    </div>
  )
}

const useReadPercent = () => {
  const y = 55
  const { h } = useWrappedElementSize()

  const scrollElement = useScrollViewElement()
  const [scrollTop, setScrollTop] = useState(0)

  useEffect(() => {
    const handler = () => {
      if (scrollElement) {
        setScrollTop(scrollElement.scrollTop)
      }
    }
    handler()
    scrollElement?.addEventListener("scroll", handler)
    return () => {
      scrollElement?.removeEventListener("scroll", handler)
    }
  }, [scrollElement])

  const readPercent = useMemo(() => {
    const winHeight = getViewport().h
    const deltaHeight = Math.min(scrollTop, winHeight)

    return Math.floor(Math.min(Math.max(0, ((scrollTop - y + deltaHeight) / h) * 100), 100)) || 0
  }, [y, h, scrollTop])

  return [readPercent, scrollTop]
}

export const ContainerToc: FC = memo(() => {
  const wrappedElement = useWrappedElement()

  return (
    <RootPortal to={wrappedElement!}>
      <div className="group absolute right-[-130px] top-0 h-full w-[100px]" data-hide-in-print>
        <div className="sticky top-0">
          <Toc
            onItemClick={() => {
              EventBus.dispatch("FOCUS_ENTRY_CONTAINER")
            }}
            className={cn(
              "flex flex-col items-end animate-in fade-in-0 slide-in-from-bottom-12 easing-spring spring-soft",
              "max-h-[calc(100vh-100px)] overflow-auto scrollbar-none",

              "@[700px]:-translate-x-12 @[800px]:-translate-x-16 @[900px]:translate-x-0 @[900px]:items-start",
            )}
          />

          <BackTopIndicator
            className={
              "@[700px]:-translate-x-4 @[800px]:-translate-x-8 @[900px]:translate-x-0 @[900px]:items-start"
            }
          />
        </div>
      </div>
    </RootPortal>
  )
})

const BackTopIndicator: Component = memo(({ className }) => {
  const [readPercent] = useReadPercent()
  const scrollElement = useScrollViewElement()
  return (
    <span
      className={cn(
        "mt-2 flex grow flex-col px-2 font-sans text-sm text-gray-800 dark:text-neutral-300",
        className,
      )}
    >
      <div className="flex items-center gap-2 tabular-nums">
        <IconOpacityTransition
          icon1={<MaterialSymbolsProgressActivity />}
          icon2={<CircleProgress percent={readPercent!} size={14} strokeWidth={2} />}
          status={readPercent === 0 ? "init" : "done"}
        />
        <span>{readPercent}%</span>
        <br />
      </div>
      <MotionButtonBase
        onClick={() => {
          springScrollTo(0, scrollElement!)
        }}
        className={cn(
          "mt-1 flex flex-nowrap items-center gap-2 opacity-50 transition-all duration-500 hover:opacity-100",
          readPercent! > 10 ? "" : "pointer-events-none opacity-0",
        )}
      >
        <i className="i-mingcute-arrow-up-circle-line" />
        <span className="whitespace-nowrap">Back Top</span>
      </MotionButtonBase>
    </span>
  )
})

export function AISummary({ entryId }: { entryId: string }) {
  const { t } = useTranslation()
  const entry = useEntry(entryId)
  const showAISummary = useShowAISummary() || !!entry?.settings?.summary
  const summary = useAuthQuery(
    Queries.ai.summary({
      entryId,
      language: entry?.settings?.translation,
    }),
    {
      enabled: showAISummary,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      meta: {
        persist: true,
      },
    },
  )

  if (!showAISummary || (!summary.isLoading && !summary.data)) {
    return null
  }

  return (
    <div className="group my-8 space-y-1 rounded-lg border px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-medium text-zinc-800 dark:text-neutral-400">
          <i className="i-mgc-magic-2-cute-re align-middle" />
          <span>{t("entry_content.ai_summary")}</span>
        </div>
        {summary.data && (
          <CopyButton
            value={summary.data}
            className="sm:opacity-0 sm:duration-200 sm:group-hover:opacity-100"
          />
        )}
      </div>
      <AutoResizeHeight spring className="text-sm leading-relaxed">
        {summary.isLoading ? SummaryLoadingSkeleton : summary.data}
      </AutoResizeHeight>
    </div>
  )
}

import { getViewport } from "@follow/components/hooks/useViewport.js"
import { CircleProgress } from "@follow/components/icons/Progress.js"
import { Button, MotionButtonBase } from "@follow/components/ui/button/index.js"
import { LoadingWithIcon } from "@follow/components/ui/loading/index.jsx"
import { RootPortal } from "@follow/components/ui/portal/index.jsx"
import { useScrollViewElement } from "@follow/components/ui/scroll-area/hooks.js"
import { WEB_BUILD } from "@follow/shared/constants"
import { useEntry } from "@follow/store/entry/hooks"
import { useFeedById } from "@follow/store/feed/hooks"
import { useInboxById } from "@follow/store/inbox/hooks"
import { springScrollTo } from "@follow/utils/scroller"
import { cn } from "@follow/utils/utils"
import type { FallbackRender } from "@sentry/react"
import { useStore } from "jotai"
import type { FC } from "react"
import { memo, useEffect, useLayoutEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import {
  ReadabilityStatus,
  setReadabilityStatus,
  useEntryInReadabilityStatus,
  useEntryIsInReadability,
} from "~/atoms/readability"
import { useShowSourceContent } from "~/atoms/source-content"
import type { TocRef } from "~/components/ui/markdown/components/Toc"
import { Toc } from "~/components/ui/markdown/components/Toc"
import { getNewIssueUrl } from "~/lib/issues"
import {
  useIsSoFWrappedElement,
  useWrappedElement,
  useWrappedElementSize,
} from "~/providers/wrapped-element-provider"

import { ReadabilityAutoToggleEffect } from "./ApplyEntryActions"
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

export const TitleMetaHandler: Component<{
  entryId: string
}> = ({ entryId }) => {
  const entry = useEntry(entryId, (state) => {
    const { feedId, inboxHandle } = state
    const { title } = state

    return { feedId, inboxId: inboxHandle, title }
  })

  const feed = useFeedById(entry?.feedId)
  const inbox = useInboxById(entry?.inboxId)
  const feedTitle = feed?.title || inbox?.title
  const atTop = useIsSoFWrappedElement()
  useEffect(() => {
    setEntryContentScrollToTop(true)
  }, [entryId])
  useLayoutEffect(() => {
    setEntryContentScrollToTop(atTop)
  }, [atTop])

  useEffect(() => {
    if (entry?.title && feedTitle) {
      setEntryTitleMeta({ title: entry.title, description: feedTitle })
    }
    return () => {
      setEntryTitleMeta(null)
    }
  }, [entryId, entry?.title, feedTitle])
  return null
}

export const ReadabilityNotice = ({ entryId }: { entryId: string }) => {
  const { t } = useTranslation()
  const { t: T } = useTranslation("common")
  const result = useEntry(entryId, (state) => state.readabilityContent)
  const isInReadability = useEntryIsInReadability(entryId)
  const status = useEntryInReadabilityStatus(entryId)

  if (!isInReadability) {
    return null
  }

  return (
    <div className="grow">
      {result ? (
        <p className="mb-4 flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50/30 p-3 text-sm text-blue-700 shadow-sm dark:border-blue-800/30 dark:bg-blue-900/10 dark:text-blue-300">
          <i className="i-mgc-information-cute-re self-baseline text-lg" />
          {t("entry_content.readability_notice")}
        </p>
      ) : (
        <>
          {status === ReadabilityStatus.FAILURE ? (
            <div className="center mt-36 flex flex-col items-center gap-3">
              <i className="i-mgc-warning-cute-re text-red text-4xl" />
              <span className="text-balance text-center text-sm">
                {t("entry_content.fetching_content_failed")}
              </span>
              <Button
                variant="outline"
                onClick={() => {
                  setReadabilityStatus({
                    [entryId]: ReadabilityStatus.INITIAL,
                  })
                }}
              >
                {T("words.back")}
              </Button>
            </div>
          ) : (
            <div className="center mt-32 flex flex-col gap-2">
              <LoadingWithIcon size="large" icon={<i className="i-mgc-docment-cute-re" />} />
              <span className="text-sm">{t("entry_content.fetching_content")}</span>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export const NoContent: FC<{
  id: string
  url: string
}> = ({ id, url }) => {
  const status = useEntryInReadabilityStatus(id)
  const showSourceContent = useShowSourceContent()
  const { t } = useTranslation("app")

  if (status !== ReadabilityStatus.INITIAL && status !== ReadabilityStatus.FAILURE) {
    return null
  }
  return (
    <div className="center">
      <div className="space-y-2 text-balance text-center text-sm text-zinc-400">
        {(WEB_BUILD || status === ReadabilityStatus.FAILURE) && (
          <span>{t("entry_content.no_content")}</span>
        )}
        {!showSourceContent && url && <ReadabilityAutoToggleEffect url={url} id={id} />}
      </div>
    </div>
  )
}

export const RenderError: FallbackRender = ({ error }) => {
  const { t } = useTranslation()
  const nextError = typeof error === "string" ? new Error(error) : (error as Error)
  return (
    <div className="center mt-16 flex flex-col gap-2">
      <i className="i-mgc-close-cute-re text-red text-3xl" />
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

  const store = useStore()
  const readPercent = useMemo(() => {
    const winHeight = getViewport(store).h
    const deltaHeight = Math.min(scrollTop, winHeight)

    return Math.floor(Math.min(Math.max(0, ((scrollTop - y + deltaHeight) / h) * 100), 100)) || 0
  }, [store, scrollTop, h])

  return [readPercent, scrollTop]
}

export const ContainerToc = memo(
  ({ ref, ..._ }: ComponentType & { ref?: React.Ref<TocRef | null> }) => {
    const wrappedElement = useWrappedElement()

    return (
      <RootPortal to={wrappedElement!}>
        <div
          className="@[770px]:block group absolute right-[-130px] top-0 hidden h-full w-[100px]"
          data-hide-in-print
        >
          <div className="sticky top-0">
            <Toc
              ref={ref}
              className={cn(
                "animate-in fade-in-0 slide-in-from-bottom-12 easing-spring spring-soft flex flex-col items-end",
                "scrollbar-none max-h-[calc(100vh-100px)] overflow-auto",
                "@[700px]:-translate-x-12 @[800px]:-translate-x-4 @[900px]:translate-x-0 @[900px]:items-start",
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
  },
)
const BackTopIndicator: Component = memo(({ className }) => {
  const [readPercent] = useReadPercent()
  const scrollElement = useScrollViewElement()

  if (readPercent === 0) return

  return (
    <span
      className={cn(
        "mt-2 flex grow flex-col px-2 font-sans text-sm text-gray-800 dark:text-neutral-300",
        className,
      )}
    >
      <div className="flex items-center gap-2 tabular-nums">
        <CircleProgress percent={readPercent!} size={14} strokeWidth={2} />
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

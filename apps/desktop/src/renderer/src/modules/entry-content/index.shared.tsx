import { getViewport } from "@follow/components/hooks/useViewport.js"
import { CircleProgress } from "@follow/components/icons/Progress.js"
import { Button, MotionButtonBase } from "@follow/components/ui/button/index.js"
import { LoadingWithIcon } from "@follow/components/ui/loading/index.jsx"
import { RootPortal } from "@follow/components/ui/portal/index.jsx"
import { useScrollViewElement } from "@follow/components/ui/scroll-area/hooks.js"
import { WEB_BUILD } from "@follow/shared/constants"
import { EventBus } from "@follow/utils/event-bus"
import { springScrollTo } from "@follow/utils/scroller"
import { cn } from "@follow/utils/utils"
import type { FallbackRender } from "@sentry/react"
import type { FC } from "react"
import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import {
  ReadabilityStatus,
  setReadabilityStatus,
  useEntryInReadabilityStatus,
  useEntryIsInReadability,
  useEntryReadabilityContent,
} from "~/atoms/readability"
import { enableShowSourceContent } from "~/atoms/source-content"
import { Toc } from "~/components/ui/markdown/components/Toc"
import { toggleEntryReadability } from "~/hooks/biz/useEntryActions"
import { getNewIssueUrl } from "~/lib/issues"
import {
  useIsSoFWrappedElement,
  useWrappedElement,
  useWrappedElementSize,
} from "~/providers/wrapped-element-provider"
import { useEntry } from "~/store/entry"
import { useFeedById } from "~/store/feed"
import { useInboxById } from "~/store/inbox"

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

export const ReadabilityNotice = ({ entryId }: { entryId: string }) => {
  const { t } = useTranslation()
  const result = useEntryReadabilityContent(entryId)
  const isInReadability = useEntryIsInReadability(entryId)
  if (!isInReadability) {
    return null
  }

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
        {(WEB_BUILD || status === ReadabilityStatus.FAILURE) && (
          <span>{t("entry_content.no_content")}</span>
        )}
        {!sourceContent && url && <ReadabilityAutoToggleEffect url={url} id={id} />}
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
  const onceRef = useRef(false)

  useEffect(() => {
    if (!onceRef.current) {
      onceRef.current = true
      setReadabilityStatus({
        [id]: ReadabilityStatus.INITIAL,
      })
      toggleEntryReadability({ id, url })
    }
  }, [id, url])

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
              "animate-in fade-in-0 slide-in-from-bottom-12 easing-spring spring-soft flex flex-col items-end",
              "scrollbar-none max-h-[calc(100vh-100px)] overflow-auto",
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

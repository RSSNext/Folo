import { Spring } from "@follow/components/constants/spring.js"
import { EmptyIcon } from "@follow/components/icons/empty.jsx"
import { CollapseControlled } from "@follow/components/ui/collapse/Collapse.js"
import type { LinkProps } from "@follow/components/ui/link/LinkWithTooltip.js"
import { LoadingCircle } from "@follow/components/ui/loading/index.jsx"
import { ScrollArea } from "@follow/components/ui/scroll-area/index.js"
import {
  Tooltip,
  TooltipContent,
  TooltipPortal,
  TooltipTrigger,
} from "@follow/components/ui/tooltip/index.jsx"
import { cn, isBizId } from "@follow/utils/utils"
import { noop } from "foxact/noop"
import type { Components } from "hast-util-to-jsx-runtime"
import { m } from "motion/react"
import { useMemo, useState } from "react"
import { Trans, useTranslation } from "react-i18next"

import { useGeneralSettingSelector } from "~/atoms/settings/general"
import { Markdown } from "~/components/ui/markdown/Markdown"
import { MarkdownLink } from "~/components/ui/markdown/renderers"
import { usePeekModal } from "~/hooks/biz/usePeekModal"
import { useAuthQuery } from "~/hooks/common"
import { apiClient } from "~/lib/api-fetch"
import { defineQuery } from "~/lib/defineQuery"

import { remarkSnowflakeId } from "./plugins/parse-snowflake"
import type { DailyItemProps, DailyView } from "./types"
import { useParseDailyDate } from "./useParseDailyDate"

export const DailyItem = ({
  view,
  day,
  className,
  onClick,
  isOpened,
}: DailyItemProps & {
  isOpened: boolean
  onClick: () => void
}) => {
  const { title, startDate, endDate } = useParseDailyDate(day)

  return (
    <CollapseControlled
      isOpened={isOpened}
      onOpenChange={noop}
      collapseId={`${day}`}
      hideArrow
      contentClassName="flex-1 flex flex-col"
      title={
        <button type="button" className="container" onClick={onClick}>
          <DailyReportTitle title={title} startDate={startDate} endDate={endDate} />
        </button>
      }
      className={cn(className, "mx-auto w-full max-w-lg border-b last:border-b-0")}
    >
      <DailyReportContent endDate={endDate} view={view} startDate={startDate} />
    </CollapseControlled>
  )
}

export const DailyReportTitle = ({
  endDate,
  startDate,
  title,
  containerClassName,
}: {
  title: string
  startDate: number
  endDate: number
  containerClassName?: string
}) => {
  const { t } = useTranslation()
  const language = useGeneralSettingSelector((s) => s.language)
  const locale = useMemo(() => {
    try {
      return new Intl.Locale(language)
    } catch {
      return new Intl.Locale("en-US")
    }
  }, [language])

  return (
    <m.div
      className={cn("flex items-center justify-center gap-2 pb-6 text-base", containerClassName)}
      layoutId={`daily-report-title-${title}`}
      transition={Spring.presets.smooth}
    >
      <i className="i-mgc-ai-cute-re" />
      <div className="font-medium">{t("ai_daily.title", { title })}</div>
      <Tooltip>
        <TooltipTrigger asChild>
          <i className="i-mgc-question-cute-re text-sm" />
        </TooltipTrigger>
        <TooltipPortal>
          <TooltipContent>
            <ul className="list-outside list-decimal text-wrap pl-6 text-left text-sm">
              <li>
                <Trans
                  i18nKey="ai_daily.tooltip.content"
                  components={{
                    From: (
                      <span>
                        {new Date(startDate).toLocaleTimeString(locale, {
                          weekday: "short",
                          hour: "numeric",
                          minute: "numeric",
                        })}
                      </span>
                    ),
                    To: (
                      <span>
                        {new Date(endDate + 1).toLocaleTimeString(locale, {
                          weekday: "short",
                          hour: "numeric",
                          minute: "numeric",
                        })}
                      </span>
                    ),
                  }}
                />
              </li>
              <li>{t("ai_daily.tooltip.update_schedule")}</li>
            </ul>
          </TooltipContent>
        </TooltipPortal>
      </Tooltip>
    </m.div>
  )
}

const useQueryData = ({
  endDate,
  startDate,
  view,
}: Pick<DailyReportContentProps, "view" | "startDate" | "endDate">) =>
  useAuthQuery(
    defineQuery(["daily", view, startDate, endDate], async () => {
      const res = await apiClient.ai.daily.$get({
        query: {
          startDate: `${+startDate}`,
          view: `${view}`,
        },
      })
      return res.data
    }),
    {
      meta: {
        persist: true,
      },
    },
  )

interface DailyReportContentProps {
  view: DailyView
  startDate: number
  endDate: number
}

const DailyReportContent: Component<DailyReportContentProps> = ({
  endDate,
  startDate,

  view,
}) => {
  const content = useQueryData({ endDate, startDate, view })

  const RelatedEntryLink = useState(() => createRelatedEntryLink("modal"))[0]

  return (
    <div className="relative h-0 flex-1 grow">
      <div className="absolute inset-0 flex">
        <ScrollArea.ScrollArea mask flex viewportClassName="grow" rootClassName="grow">
          {content.isLoading ? (
            <LoadingCircle size="large" className="center flex h-[calc(100vh-176px)] text-center" />
          ) : (
            !!content.data && (
              <m.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={Spring.smooth(0.35)}
                className="overflow-hidden"
              >
                <Markdown
                  applyMiddleware={(pipeline) => {
                    pipeline.use(remarkSnowflakeId)

                    return pipeline
                  }}
                  components={
                    {
                      "snowflake-id": SnowflakeId,
                      a: RelatedEntryLink as Components["a"],
                    } as any as Components
                  }
                  className="prose-sm prose-p:my-1 prose-ul:my-1 prose-ul:list-outside prose-ul:list-disc prose-li:marker:text-accent mt-4 px-6"
                >
                  {content.data}
                </Markdown>
              </m.div>
            )
          )}
        </ScrollArea.ScrollArea>
      </div>
    </div>
  )
}

export const DailyReportModalContent: Component<DailyReportContentProps> = ({
  endDate,
  startDate,
  view,
}) => {
  const content = useQueryData({ endDate, startDate, view })
  const { t } = useTranslation()
  const RelatedEntryLink = useState(() => createRelatedEntryLink("toast"))[0]

  if (!content.data && !content.isLoading)
    return (
      <div className="center pointer-events-none inset-0 my-8 flex-col gap-4 opacity-80 lg:absolute lg:my-0 lg:translate-y-6">
        <EmptyIcon />
        <p>{t("ai_daily.no_found")}</p>
      </div>
    )

  return (
    <div className="center grow flex-col">
      <div className="flex grow flex-col">
        {content.isLoading ? (
          <LoadingCircle
            size="large"
            className="center pointer-events-none h-24 text-center lg:absolute lg:inset-0 lg:mt-8 lg:h-auto"
          />
        ) : content.data ? (
          <Markdown
            components={{
              a: RelatedEntryLink as Components["a"],
            }}
            className="prose-sm prose-p:my-1 prose-ul:my-1 prose-ul:list-outside prose-ul:list-disc prose-li:marker:text-accent mt-4 grow overflow-auto px-2 lg:h-0 lg:px-6"
          >
            {content.data}
          </Markdown>
        ) : null}
      </div>
    </div>
  )
}

const createRelatedEntryLink = (variant: "toast" | "modal") => (props: LinkProps) => {
  const { href, children } = props
  const entryId = isBizId(href) ? href : null

  const peekModal = usePeekModal()
  if (!entryId) {
    return <MarkdownLink {...props} />
  }
  return (
    <button
      type="button"
      className="follow-link--underline text-text cursor-pointer font-semibold no-underline"
      onClick={() => {
        peekModal(entryId, variant)
      }}
    >
      {children}
      <i className="i-mgc-arrow-right-up-cute-re size-[0.9em] translate-y-[2px] opacity-70" />
    </button>
  )
}

interface SnowflakeIdProps {
  id: string
  children?: React.ReactNode
  index: number
}

const SnowflakeId: React.FC<SnowflakeIdProps> = ({ id: entryId, index }) => {
  const peekModal = usePeekModal()

  return (
    <button
      type="button"
      className="follow-link--underline text-text cursor-pointer font-semibold no-underline"
      onClick={() => {
        peekModal(entryId, "modal")
      }}
    >
      <sup className="inline-flex items-center gap-0.5 font-medium">
        <span className="text-[0.65rem] opacity-70">{index}</span>
      </sup>
    </button>
  )
}

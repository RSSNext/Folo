import { Spring } from "@follow/components/constants/spring.js"
import { EmptyIcon } from "@follow/components/icons/empty.jsx"
import { LoadingCircle } from "@follow/components/ui/loading/index.jsx"
import { RootPortal } from "@follow/components/ui/portal/index.js"
import { ScrollArea } from "@follow/components/ui/scroll-area/index.js"
import {
  Tooltip,
  TooltipContent,
  TooltipPortal,
  TooltipTrigger,
} from "@follow/components/ui/tooltip/index.jsx"
import { nextFrame, stopPropagation } from "@follow/utils/dom"
import { cn, isBizId } from "@follow/utils/utils"
import { noop } from "foxact/noop"
import type { Components } from "hast-util-to-jsx-runtime"
import type { Variant } from "motion/react"
import { m, useAnimationControls } from "motion/react"
import type { FC } from "react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Trans, useTranslation } from "react-i18next"

import { MenuItemText } from "~/atoms/context-menu"
import { useGeneralSettingSelector } from "~/atoms/settings/general"
import { CollapseControlled } from "~/components/ui/collapse"
import { RelativeTime } from "~/components/ui/datetime"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu/dropdown-menu"
import type { LinkProps } from "~/components/ui/link"
import { Markdown } from "~/components/ui/markdown/Markdown"
import { MarkdownLink } from "~/components/ui/markdown/renderers"
import { Media } from "~/components/ui/media"
import { usePreviewMedia } from "~/components/ui/media/hooks"
import { PeekModal } from "~/components/ui/modal/inspire/PeekModal"
import { PlainModal } from "~/components/ui/modal/stacked/custom-modal"
import { useModalStack } from "~/components/ui/modal/stacked/hooks"
import { Paper } from "~/components/ui/paper"
import { useSortedEntryActions } from "~/hooks/biz/useEntryActions"
import { getRouteParams } from "~/hooks/biz/useRouteParams"
import { useAuthQuery } from "~/hooks/common"
import { apiClient } from "~/lib/api-fetch"
import { defineQuery } from "~/lib/defineQuery"
import { COMMAND_ID } from "~/modules/command/commands/id"
import { hasCommand } from "~/modules/command/hooks/use-command"
import { StarIcon } from "~/modules/entry-column/star-icon"
import { EntryContent } from "~/modules/entry-content"
import { CommandDropdownMenuItem } from "~/modules/entry-content/actions/more-actions"
import type { FeedIconEntry } from "~/modules/feed/feed-icon"
import { FeedIcon } from "~/modules/feed/feed-icon"
import { Queries } from "~/queries"
import { useEntry } from "~/store/entry"
import { useFeedById } from "~/store/feed"

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

const usePeekModal = () => {
  const { present } = useModalStack()
  return useCallback(
    (entryId: string, variant: "toast" | "modal") => {
      const basePresentProps = {
        clickOutsideToDismiss: true,
        title: "Entry Preview",
      }

      if (variant === "toast") {
        present({
          ...basePresentProps,
          CustomModalComponent: PlainModal,
          content: () => <EntryToastPreview entryId={entryId} />,
          overlay: false,
          modal: false,
          modalContainerClassName: "right-0 left-[auto]",
        })
      } else {
        present({
          ...basePresentProps,
          autoFocus: false,
          modalClassName:
            "relative mx-auto mt-[10vh] scrollbar-none max-w-full overflow-auto px-2 lg:max-w-[65rem] lg:p-0",

          CustomModalComponent: ({ children }) => {
            const feedId = useEntry(entryId, (state) => state.feedId)
            if (!feedId) return null

            return (
              <PeekModal
                rightActions={[
                  {
                    onClick: () => {},
                    label: "More Actions",
                    icon: <EntryMoreActions entryId={entryId} />,
                  },
                ]}
                to={`/timeline/view-${getRouteParams().view}/${feedId}/${entryId}`}
              >
                {children}
              </PeekModal>
            )
          },
          content: () => <EntryModalPreview entryId={entryId} />,
          overlay: true,
        })
      }
    },
    [present],
  )
}
const EntryToastPreview = ({ entryId }: { entryId: string }) => {
  useAuthQuery(Queries.entries.byId(entryId))

  const variants: Record<string, Variant> = {
    enter: {
      x: 0,
      opacity: 1,
    },
    initial: {
      x: 700,
      opacity: 0.9,
    },
    exit: {
      x: 750,
      opacity: 0,
    },
  }

  const entry = useEntry(entryId, (state) => {
    const { collections, feedId } = state
    const { author, authorAvatar, description, publishedAt } = state.entries
    const isInCollection = !!collections

    const media = state.entries.media || []
    const firstPhotoUrl = media.find((a) => a.type === "photo")?.url
    const iconEntry: FeedIconEntry = {
      firstPhotoUrl,
      authorAvatar,
    }

    return {
      author,
      description,
      feedId,
      iconEntry,
      isInCollection,
      media,
      publishedAt,
    }
  })

  const feed = useFeedById(entry?.feedId)
  const controller = useAnimationControls()

  const isDisplay = !!entry && !!feed
  useEffect(() => {
    if (isDisplay) {
      nextFrame(() => controller.start("enter"))
    }
  }, [controller, isDisplay])

  const previewMedia = usePreviewMedia()

  if (!isDisplay) return null

  return (
    <m.div
      tabIndex={-1}
      initial="initial"
      animate={controller}
      onPointerDown={stopPropagation}
      onPointerDownCapture={stopPropagation}
      variants={variants}
      onWheel={stopPropagation}
      transition={{
        type: "spring",
        mass: 0.4,
        tension: 120,
        friction: 1.4,
      }}
      exit="exit"
      layout="size"
      className={cn(
        "shadow-perfect bg-theme-background relative flex flex-col items-center rounded-xl border p-8",
        "mr-4 mt-4 max-h-[500px] w-[60ch] max-w-full overflow-auto",
      )}
    >
      <div className="flex w-full gap-3">
        <FeedIcon
          fallback
          className="mask-squircle mask"
          feed={feed}
          entry={entry.iconEntry}
          size={36}
        />
        <div className="flex min-w-0 grow flex-col">
          <div className="w-[calc(100%-10rem)] space-x-1">
            <span className="font-semibold">{entry.author}</span>
            <span className="text-zinc-500">·</span>
            <span className="text-zinc-500">
              <RelativeTime date={entry.publishedAt} />
            </span>
          </div>
          <div
            className={cn(
              "relative mt-0.5 whitespace-pre-line text-base",
              entry.isInCollection && "pr-5",
            )}
          >
            <div
              className={cn(
                "rounded-xl p-3 align-middle text-[15px]",
                "rounded-tl-none bg-zinc-600/5 dark:bg-zinc-500/20",
                "mt-1 -translate-x-3",
                "break-words",
              )}
            >
              {entry.description}

              {!!entry.media?.length && (
                <div className="mt-1 flex w-full gap-2 overflow-x-auto">
                  {entry.media.map((media, i, mediaList) => (
                    <Media
                      key={media.url}
                      src={media.url}
                      type={media.type}
                      previewImageUrl={media.preview_image_url}
                      className="size-28 shrink-0 cursor-zoom-in"
                      loading="lazy"
                      proxy={{
                        width: 224,
                        height: 224,
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        previewMedia(mediaList, i)
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
            {entry.isInCollection && <StarIcon />}
          </div>

          {/* End right column */}
        </div>
      </div>
    </m.div>
  )
}

const EntryModalPreview = ({ entryId }: { entryId: string }) => (
  <Paper className="p-0 !pt-16 empty:hidden">
    <EntryContent
      className="h-auto [&_#entry-action-header-bar]:!bg-transparent"
      entryId={entryId}
    />
  </Paper>
)

const EntryMoreActions: FC<{ entryId: string }> = ({ entryId }) => {
  const { view } = getRouteParams()
  const { moreAction, mainAction } = useSortedEntryActions({ entryId, view })

  const actionConfigs = useMemo(
    () =>
      [...moreAction, ...mainAction].filter(
        (action) => action instanceof MenuItemText && hasCommand(action.id),
      ),
    [moreAction, mainAction],
  )

  const availableActions = useMemo(
    () =>
      actionConfigs.filter(
        (item) => item instanceof MenuItemText && item.id !== COMMAND_ID.settings.customizeToolbar,
      ),
    [actionConfigs],
  )

  const extraAction = useMemo(
    () =>
      actionConfigs.filter(
        (item) => item instanceof MenuItemText && item.id === COMMAND_ID.settings.customizeToolbar,
      ),
    [actionConfigs],
  )

  if (availableActions.length === 0 && extraAction.length === 0) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <i className="i-mgc-more-1-cute-re" />
      </DropdownMenuTrigger>
      <RootPortal>
        <DropdownMenuContent alignOffset={20} sideOffset={30}>
          {availableActions.map((config) =>
            config instanceof MenuItemText ? (
              <CommandDropdownMenuItem
                key={config.id}
                commandId={config.id}
                onClick={config.click!}
                active={config.active}
              />
            ) : null,
          )}
        </DropdownMenuContent>
      </RootPortal>
    </DropdownMenu>
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

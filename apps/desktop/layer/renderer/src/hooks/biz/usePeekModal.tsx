import { Spring } from "@follow/components/constants/spring.js"
import { RootPortal } from "@follow/components/ui/portal/index.js"
import { useIsEntryStarred } from "@follow/store/collection/hooks"
import { useEntry, usePrefetchEntryDetail } from "@follow/store/entry/hooks"
import { useFeedById } from "@follow/store/feed/hooks"
import { nextFrame, stopPropagation } from "@follow/utils/dom"
import { cn } from "@follow/utils/utils"
import type { Variant } from "motion/react"
import { m, useAnimationControls } from "motion/react"
import type { FC } from "react"
import { useCallback, useEffect, useMemo } from "react"

import { MenuItemText } from "~/atoms/context-menu"
import { RelativeTime } from "~/components/ui/datetime"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu/dropdown-menu"
import { usePreviewMedia } from "~/components/ui/media/hooks"
import { Media } from "~/components/ui/media/Media"
import { PeekModal } from "~/components/ui/modal/inspire/PeekModal"
import { PlainModal } from "~/components/ui/modal/stacked/custom-modal"
import { useModalStack } from "~/components/ui/modal/stacked/hooks"
import { Paper } from "~/components/ui/paper"
import { useSortedEntryActions } from "~/hooks/biz/useEntryActions"
import { getRouteParams } from "~/hooks/biz/useRouteParams"
import { COMMAND_ID } from "~/modules/command/commands/id"
import { hasCommand } from "~/modules/command/hooks/use-command"
import { StarIcon } from "~/modules/entry-column/star-icon"
import { CommandDropdownMenuItem } from "~/modules/entry-content/actions/more-actions"
import { EntryContent } from "~/modules/entry-content/components/entry-content"
import type { FeedIconEntry } from "~/modules/feed/feed-icon"
import { FeedIcon } from "~/modules/feed/feed-icon"

export const usePeekModal = () => {
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
const EntryToastPreview = ({ entryId }: { entryId: string }) => {
  usePrefetchEntryDetail(entryId)

  const entry = useEntry(entryId, (state) => {
    const { feedId } = state
    const { author, authorAvatar, description, publishedAt } = state

    const media = state.media || []
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
      media,
      publishedAt,
    }
  })
  const isInCollection = useIsEntryStarred(entryId)

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
      transition={Spring.presets.snappy}
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
              isInCollection && "pr-5",
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
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation()
                        previewMedia(mediaList, i)
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
            {isInCollection && <StarIcon />}
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

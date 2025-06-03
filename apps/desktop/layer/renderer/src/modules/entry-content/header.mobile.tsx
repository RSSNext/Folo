import { MotionButtonBase } from "@follow/components/ui/button/index.js"
import { RootPortal } from "@follow/components/ui/portal/index.js"
import { findElementInShadowDOM } from "@follow/utils/dom"
import { clsx, cn } from "@follow/utils/utils"
import { DismissableLayer } from "@radix-ui/react-dismissable-layer"
import { AnimatePresence, m } from "motion/react"
import { memo, useEffect, useState } from "react"
import { RemoveScroll } from "react-remove-scroll"
import { useEventCallback } from "usehooks-ts"

import { MenuItemText } from "~/atoms/context-menu"
import { useUISettingKey } from "~/atoms/settings/ui"
import { HeaderTopReturnBackButton } from "~/components/mobile/button"
import { CommandActionButton } from "~/components/ui/button/CommandActionButton"
import { useScrollTracking, useTocItems } from "~/components/ui/markdown/components/hooks"
import { ENTRY_CONTENT_RENDER_CONTAINER_ID } from "~/constants/dom"
import type { EntryActionItem } from "~/hooks/biz/useEntryActions"
import { useSortedEntryActions } from "~/hooks/biz/useEntryActions"
import { useEntry } from "~/store/entry/hooks"

import { useCommand } from "../command/hooks/use-command"
import type { FollowCommandId } from "../command/types"
import { MoreActions } from "./actions/more-actions"
import { useEntryContentScrollToTop, useEntryTitleMeta } from "./atoms"
import type { EntryHeaderProps } from "./header.shared"

function EntryHeaderImpl({ view, entryId, className }: EntryHeaderProps) {
  const entry = useEntry(entryId, () => ({}))
  const sortedActionConfigs = useSortedEntryActions({ entryId, view })
  const actionConfigs = sortedActionConfigs.mainAction

  const entryTitleMeta = useEntryTitleMeta()
  const isAtTop = useEntryContentScrollToTop()

  const hideRecentReader = useUISettingKey("hideRecentReader")

  const shouldShowMeta = (hideRecentReader || !isAtTop) && !!entryTitleMeta?.title

  if (!entry) return null

  return (
    <div
      data-hide-in-print
      className={cn(
        "zen-mode-macos:ml-margin-macos-traffic-light-x relative flex min-w-0 items-center justify-between gap-3 overflow-hidden text-lg text-zinc-500 duration-200",
        shouldShowMeta && "border-border border-b",
        "pt-safe box-content h-14",
        className,
      )}
    >
      <div
        className="relative z-10 flex size-full items-center justify-between gap-3"
        data-hide-in-print
      >
        <div className="pointer-events-none absolute inset-0 flex min-w-0 items-center">
          {entryTitleMeta && (
            <div
              style={{
                transform: shouldShowMeta ? "translateY(0)" : "translateY(30px)",
                opacity: shouldShowMeta ? 1 : 0,
              }}
              className="text-text pointer-events-auto flex w-full min-w-0 shrink gap-2 truncate px-1.5 pl-10 text-sm leading-tight duration-200"
            >
              <div className="flex min-w-0 grow items-center">
                <div className="flex min-w-0 shrink items-end gap-1 truncate">
                  <span className="min-w-[50%] shrink truncate font-bold">
                    {entryTitleMeta.title}
                  </span>
                  <i className="i-mgc-line-cute-re size-[10px] shrink-0 translate-y-[-3px] rotate-[-25deg]" />
                  <span className="shrink truncate text-xs opacity-80">
                    {entryTitleMeta.description}
                  </span>
                </div>
              </div>
              <HeaderRightActions actions={actionConfigs} />
            </div>
          )}
        </div>

        <HeaderTopReturnBackButton className={"absolute left-0"} />
        <div className="flex-1" />

        <div
          className={clsx(
            "relative flex shrink-0 items-center justify-end gap-2",
            shouldShowMeta && "hidden",
          )}
        >
          {actionConfigs
            .filter((item) => item instanceof MenuItemText)
            .map((item) => (
              <CommandActionButton
                key={item.id}
                commandId={item.id}
                onClick={item.onClick}
                active={item.active}
                shortcut={item.shortcut!}
              />
            ))}
          <MoreActions entryId={entryId} />
        </div>
      </div>
    </div>
  )
}

export const EntryHeader = memo(EntryHeaderImpl)

const HeaderRightActions = ({
  className,
  actions,
}: {
  className?: string
  actions: EntryActionItem[]
}) => {
  const [ctxOpen, setCtxOpen] = useState(false)
  const [tocOpen, setTocOpen] = useState(false)

  const [markdownElement, setMarkdownElement] = useState<HTMLElement | null>(null)
  const { toc } = useTocItems(markdownElement)

  const getSetMarkdownElement = useEventCallback(() => {
    setMarkdownElement(
      findElementInShadowDOM(`#${ENTRY_CONTENT_RENDER_CONTAINER_ID}`) as HTMLElement,
    )
  })
  useEffect(() => {
    const timeout = setTimeout(getSetMarkdownElement, 1000)
    return () => clearTimeout(timeout)
  }, [getSetMarkdownElement])

  return (
    <div className={clsx(className, "flex items-center gap-2 text-zinc-500")}>
      <RootPortal>
        <AnimatePresence>
          {tocOpen && <TocPanel markdownElement={markdownElement} setTocOpen={setTocOpen} />}
        </AnimatePresence>
      </RootPortal>

      <MotionButtonBase
        disabled={toc.length === 0}
        className="center size-8 duration-200 disabled:opacity-50"
        onClick={() => setTocOpen((v) => !v)}
      >
        <TableOfContentsIcon className="size-6" />
      </MotionButtonBase>

      <MotionButtonBase className="center size-8" onClick={() => setCtxOpen((v) => !v)}>
        <i className="i-mingcute-more-1-fill size-6" />
      </MotionButtonBase>

      <RootPortal>
        <AnimatePresence>
          {ctxOpen && (
            <RemoveScroll>
              <DismissableLayer disableOutsidePointerEvents onDismiss={() => setCtxOpen(false)}>
                <m.div
                  initial={{
                    scale: 0.8,
                    opacity: 0,
                    transformOrigin: "top right",
                  }}
                  animate={{
                    scale: 1,
                    opacity: 1,
                  }}
                  exit={{
                    scale: 0.8,
                    opacity: 0,
                    transformOrigin: "top right",
                  }}
                  transition={{
                    type: "spring",
                    damping: 20,
                    stiffness: 300,
                    mass: 0.8,
                  }}
                  className="shadow-modal bg-theme-background fixed right-1 top-1 z-[1] mt-14 max-w-full rounded-lg border"
                >
                  <div className="flex flex-col items-center py-2">
                    {actions
                      .filter((item) => item instanceof MenuItemText)
                      .map((item) => (
                        <CommandMotionButton
                          key={item.id}
                          commandId={item.id}
                          active={item.active}
                          onClick={() => {
                            setCtxOpen(false)
                            item.onClick?.()
                          }}
                        />
                      ))}
                  </div>
                </m.div>
              </DismissableLayer>
            </RemoveScroll>
          )}
        </AnimatePresence>
      </RootPortal>
    </div>
  )
}

const CommandMotionButton = ({
  commandId,
  onClick,
  active,
}: {
  commandId: FollowCommandId
  onClick: () => void
  active?: boolean
}) => {
  const command = useCommand(commandId)
  if (!command) return null
  return (
    <MotionButtonBase
      onClick={onClick}
      layout={false}
      className="flex w-full items-center gap-2 px-4 py-2"
    >
      {typeof command.icon === "function" ? command.icon({ isActive: active }) : command.icon}
      {command.label.title}
    </MotionButtonBase>
  )
}

const TableOfContentsIcon = ({ className = "size-6" }) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <line x1="4" y1="6" x2="20" y2="6" />

      <line x1="4" y1="12" x2="20" y2="12" strokeWidth="1.5" />
      <line x1="4" y1="18" x2="20" y2="18" strokeWidth="1.5" />

      <line x1="7" y1="12" x2="8" y2="12" strokeWidth="2.5" />
      <line x1="7" y1="18" x2="8" y2="18" strokeWidth="2.5" />
    </svg>
  )
}

const TocPanel = ({
  markdownElement,

  setTocOpen,
}: {
  markdownElement: HTMLElement | null

  setTocOpen: (v: boolean) => void
}) => {
  const { toc, rootDepth } = useTocItems(markdownElement)
  const { currentScrollRange, handleScrollTo } = useScrollTracking(toc, {})
  return (
    <RemoveScroll>
      <DismissableLayer onDismiss={() => setTocOpen(false)}>
        <m.div
          initial={{ y: "-100%" }}
          animate={{ y: 0 }}
          exit={{ y: "-100%" }}
          transition={{
            type: "spring",
            damping: 20,
            stiffness: 150,
            mass: 0.8,
          }}
          className="bg-background fixed left-1/3 right-0 top-0 z-[1] mt-14 max-h-[60svh] max-w-full overflow-auto rounded-bl-md border border-t-0 px-3 py-1.5 shadow-sm"
        >
          <ul className="text-sm">
            {toc.map((heading, index) => (
              <li
                key={heading.anchorId}
                className={cn(
                  "flex w-full items-center",
                  currentScrollRange[0] === index && "text-accent",
                )}
                style={{ paddingLeft: `${(heading.depth - rootDepth) * 12}px` }}
              >
                <button
                  className={cn("group flex w-full cursor-pointer justify-between py-1.5")}
                  type="button"
                  onClick={() => {
                    handleScrollTo(index, heading.$heading, heading.anchorId)
                  }}
                >
                  <span className="group-hover:text-accent/80 text-left duration-200">
                    {heading.title}
                  </span>

                  <span className="ml-4 text-[8px] opacity-50">H{heading.depth}</span>
                </button>
              </li>
            ))}
          </ul>
        </m.div>
      </DismissableLayer>
    </RemoveScroll>
  )
}

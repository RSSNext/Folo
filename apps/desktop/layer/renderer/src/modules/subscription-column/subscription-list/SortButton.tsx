import { isMobile } from "@follow/components/hooks/useMobile.js"
import { RootPortal } from "@follow/components/ui/portal/index.js"
import { cn } from "@follow/utils/utils"
import * as Popover from "@radix-ui/react-popover"
import { AnimatePresence, m } from "motion/react"
import { useId } from "react"
import { useTranslation } from "react-i18next"

import { IconOpacityTransition } from "~/components/ux/transition/icon"
import { useHoverPopover } from "~/hooks/common/useHoverPopover"

import {
  getFeedListSort,
  setFeedListSortBy,
  setFeedListSortOrder,
  toggleFeedListSortBy,
  useFeedListSort,
} from "../atom"

const SORT_LIST = [
  {
    icon: tw`i-mgc-numbers-90-sort-ascending-cute-re`,
    by: "count",
    order: "asc",
    label: "sidebar.sort.count_asc",
  },
  {
    icon: tw`i-mgc-numbers-90-sort-descending-cute-re`,
    by: "count",
    order: "desc",
    label: "sidebar.sort.count_desc",
  },

  {
    icon: tw`i-mgc-az-sort-ascending-letters-cute-re`,
    by: "alphabetical",
    order: "asc",
    label: "sidebar.sort.alphabetical_asc",
  },
  {
    icon: tw`i-mgc-az-sort-descending-letters-cute-re`,
    by: "alphabetical",
    order: "desc",
    label: "sidebar.sort.alphabetical_desc",
  },
] as const

export const SortButton = () => {
  const { by, order } = useFeedListSort()
  const { t } = useTranslation()
  const titleId = useId()

  // The options show while the pointer rests on the button, and open with the keyboard too
  const { open, show, onOpenChange, triggerProps, contentProps } = useHoverPopover({
    openDelay: 700,
  })

  return (
    <Popover.Root open={open} onOpenChange={onOpenChange}>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label={t("sidebar.sort.label")}
          {...triggerProps}
          onClick={(event) => {
            // The popover opens and closes here, not through Radix's toggle
            event.preventDefault()
            // Enter and Space open the options; a click switches between sorting by count and by
            // name, with the options a hover away
            if (isMobile() || event.detail === 0) {
              show()
              return
            }
            toggleFeedListSortBy()
          }}
          className="center"
        >
          <IconOpacityTransition
            icon2={
              order === "asc"
                ? tw`i-mgc-numbers-90-sort-ascending-cute-re`
                : tw`i-mgc-numbers-90-sort-descending-cute-re`
            }
            icon1={
              order === "asc"
                ? tw`i-mgc-az-sort-ascending-letters-cute-re`
                : tw`i-mgc-az-sort-descending-letters-cute-re`
            }
            status={by === "count" ? "done" : "init"}
          />
        </button>
      </Popover.Trigger>

      {/* Mounted only while open: a mounted popover stays a dismissable layer even when closed,
          and as the newest layer it takes Escape from any modal opened before it */}
      <AnimatePresence>
        {open && (
          <RootPortal>
            <Popover.Content
              className="z-10 -translate-x-4"
              sideOffset={5}
              aria-labelledby={titleId}
              forceMount
              {...contentProps}
            >
              <m.div
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: 10 }}
                transition={{ type: "spring", duration: 0.3 }}
                className="shadow-context-menu relative z-10 rounded-md border border-border bg-theme-background p-3"
              >
                <Popover.Arrow className="-translate-x-4 fill-border" />
                <section className="w-[170px] text-center">
                  <span id={titleId} className="text-[13px]">
                    {t("sidebar.select_sort_method")}
                  </span>
                  <div className="mt-4 grid grid-cols-2 grid-rows-2 gap-2">
                    {SORT_LIST.map(({ icon, by, order, label }) => {
                      const current = getFeedListSort()
                      const active = by === current.by && order === current.order
                      return (
                        <button
                          type="button"
                          aria-label={t(label)}
                          aria-pressed={active}
                          onClick={() => {
                            setFeedListSortBy(by)
                            setFeedListSortOrder(order)
                          }}
                          key={`${by}-${order}`}
                          className={cn(
                            "center flex aspect-square rounded border border-border",

                            "ring-0 ring-accent/20 duration-200",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
                            active && "border-accent bg-accent/5 ring-2",
                          )}
                        >
                          <i className={`${icon} size-5`} />
                        </button>
                      )
                    })}
                  </div>
                </section>
              </m.div>
            </Popover.Content>
          </RootPortal>
        )}
      </AnimatePresence>
    </Popover.Root>
  )
}

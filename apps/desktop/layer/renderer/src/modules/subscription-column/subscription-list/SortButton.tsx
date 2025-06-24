import { isMobile } from "@follow/components/hooks/useMobile.js"
import { RootPortal } from "@follow/components/ui/portal/index.js"
import { cn } from "@follow/utils/utils"
import * as HoverCard from "@radix-ui/react-hover-card"
import { AnimatePresence, m } from "motion/react"
import { useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useOnClickOutside } from "usehooks-ts"

import { IconOpacityTransition } from "~/components/ux/transition/icon"

import { getFeedListSort, setFeedListSortBy, setFeedListSortOrder, useFeedListSort } from "../atom"

const SORT_LIST = [
  { icon: tw`i-mgc-numbers-90-sort-ascending-cute-re`, by: "count", order: "asc" },
  { icon: tw`i-mgc-numbers-90-sort-descending-cute-re`, by: "count", order: "desc" },

  {
    icon: tw`i-mgc-az-sort-ascending-letters-cute-re`,
    by: "alphabetical",
    order: "asc",
  },
  {
    icon: tw`i-mgc-az-sort-descending-letters-cute-re`,
    by: "alphabetical",
    order: "desc",
  },
] as const

export const SortButton = () => {
  const { by, order } = useFeedListSort()
  const { t } = useTranslation()

  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)
  useOnClickOutside(ref as React.RefObject<HTMLElement>, () => {
    setOpen(false)
  })

  return (
    <HoverCard.Root open={open} onOpenChange={setOpen}>
      <HoverCard.Trigger
        onClick={() => {
          if (isMobile()) {
            setOpen(true)
            return
          }
          setFeedListSortBy(by === "count" ? "alphabetical" : "count")
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
      </HoverCard.Trigger>

      <RootPortal>
        <HoverCard.Content ref={ref} className="z-10 -translate-x-4" sideOffset={5} forceMount>
          <AnimatePresence>
            {open && (
              <m.div
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: 10 }}
                transition={{ type: "spring", duration: 0.3 }}
                className="border-border bg-theme-background shadow-context-menu relative z-10 rounded-md border p-3"
              >
                <HoverCard.Arrow className="fill-border -translate-x-4" />
                <section className="w-[170px] text-center">
                  <span className="text-[13px]">{t("sidebar.select_sort_method")}</span>
                  <div className="mt-4 grid grid-cols-2 grid-rows-2 gap-2">
                    {SORT_LIST.map(({ icon, by, order }) => {
                      const current = getFeedListSort()
                      const active = by === current.by && order === current.order
                      return (
                        <button
                          type="button"
                          onClick={() => {
                            setFeedListSortBy(by)
                            setFeedListSortOrder(order)
                          }}
                          key={`${by}-${order}`}
                          className={cn(
                            "center border-border flex aspect-square rounded border",

                            "ring-accent/20 ring-0 duration-200",
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
            )}
          </AnimatePresence>
        </HoverCard.Content>
      </RootPortal>
    </HoverCard.Root>
  )
}
